"""ResolveOS Orchestrator — powered by AWS Strands Agents.

This is the core of ResolveOS. It orchestrates the full autonomous workflow:

  User Outcome
       ↓
  Strands Agents (PlannerAgent, InvestigatorAgent, ActionAgent, VerificationAgent)
       ↓
  Planning → Investigation → Tool use → Decision → Human Gate → Action
       ↓
  Monitoring → Detect change → Replan → New action → Verification
       ↓
  RESOLVED (only after Verification passes)

The Human Gate is deterministic (not an LLM agent). It pauses the workflow,
persists state to the database, streams DECISION_REQUIRED to the frontend,
and waits for a real human approval before resuming.

AWS Strands Agents SDK is the ACTUAL runtime — each agent call invokes the
Strands agent loop which:
  1. Sends the prompt + tools to Amazon Bedrock
  2. Bedrock decides whether to call a tool
  3. Tool executes against real data
  4. Result feeds back to the model
  5. Model continues until done (or max turns)
"""
import json
import asyncio
import logging
import uuid
from datetime import datetime
from typing import Optional, Callable

from backend.app.models.schemas import (
    Case, CaseStatus, PlanStep, OutcomeContract, PendingApproval, ApprovalStatus
)
from backend.app.models.database import get_connection, query, execute
from backend.app.agent.outcome_contract import generate_outcome_contract, contract_to_display
from backend.app.agent.memory import BusinessMemory
from backend.app.agent.specialized_agents import (
    create_planner_agent,
    create_investigator_agent,
    create_action_agent,
    create_verification_agent,
)

logger = logging.getLogger(__name__)


class Orchestrator:
    """Main orchestrator that drives the ResolveOS agent workflow.
    
    Uses real Strands Agent instances for each phase.
    Human Gate is deterministic — pauses and resumes the async workflow.
    """

    def __init__(self, broadcast_fn: Optional[Callable] = None):
        self.memory = BusinessMemory()
        self.broadcast = broadcast_fn or self._default_broadcast
        self._pending_approvals: dict[str, PendingApproval] = {}
        self._approval_events: dict[str, asyncio.Event] = {}
        self._cancelled_cases: set[str] = set()

    def _default_broadcast(self, event: dict):
        msg = event.get("data", {}).get("message", str(event))
        print(f"  [{event.get('type', 'event')}] {msg}")

    def _emit(self, case_id: str, event_type: str, message: str,
              step_type: str = "investigate", extra: dict = None):
        """Emit a structured event to the frontend and persist to DB."""
        ts = datetime.now().strftime("%H:%M:%S")
        payload = {"timestamp": ts, "message": message, "step_type": step_type, **(extra or {})}
        self.broadcast({"type": event_type, "case_id": case_id, "data": payload})

        conn = get_connection()
        conn.execute(
            "INSERT INTO activity_log (case_id, timestamp, message, step_type) VALUES (?,?,?,?)",
            (case_id, datetime.now().isoformat(), message, step_type)
        )
        conn.commit()
        conn.close()

    def _emit_case_event(self, case_id: str, event_name: str, message: str,
                         step_type: str = "investigate"):
        """Emit a named agent event (matches frontend event enum)."""
        self._emit(case_id, "agent_event", message, step_type, {"event": event_name})

    # ── Main Entry Point ───────────────────────────────────────────────────────

    async def resolve(self, case_id: str, goal: str) -> dict:
        """Resolve a case from goal to verified outcome.
        
        This is the main Strands-powered autonomous loop.
        """
        self._emit_case_event(case_id, "AGENT_STARTED",
                               "ResolveOS agent starting autonomous workflow", "plan")

        # === PHASE 1: UNDERSTAND — Generate Outcome Contract ==================
        self._update_case_status(case_id, CaseStatus.PLANNING)
        contract = generate_outcome_contract(goal)
        self._persist_contract(case_id, contract)

        self._emit_case_event(case_id, "OBJECTIVE_UNDERSTOOD",
                               f"Outcome contract created — Goal: {contract.goal}", "plan")
        self._emit(case_id, "activity",
                   f"Budget: ₹{contract.max_spend:,.0f} | Max replans: {contract.max_replans} | "
                   f"Risk threshold: {contract.risk_threshold:.0%}", "plan")

        # === PHASE 2: INVESTIGATE — Strands InvestigatorAgent =================
        self._update_case_status(case_id, CaseStatus.INVESTIGATING)
        self._emit_case_event(case_id, "TOOL_STARTED",
                               "InvestigatorAgent: gathering business intelligence...", "investigate")

        investigation = await self._run_investigator(case_id, contract)
        risk_level = investigation.get("risk_level", 0.5)
        self._update_case_risk(case_id, risk_level)

        self._emit_case_event(case_id, "EVIDENCE_FOUND",
                               f"Investigation complete — Risk: {risk_level:.0%} | "
                               f"{investigation.get('risk_reason', '')}", "investigate")
        self._emit_case_event(case_id, "RISK_UPDATED",
                               f"Risk level set to {risk_level:.0%}", "investigate")

        # === PHASE 3: PLAN — Strands PlannerAgent ==============================
        self._emit_case_event(case_id, "PLAN_CREATED",
                               "PlannerAgent: creating execution plan...", "plan")
        plan_steps = await self._run_planner(case_id, contract, investigation)
        self._persist_plan(case_id, plan_steps)

        self._emit_case_event(case_id, "PLAN_CREATED",
                               f"Plan created: {len(plan_steps)} steps", "plan")

        # === PHASE 4: EXECUTE WITH REPLAN LOOP ================================
        for replan_attempt in range(contract.max_replans + 1):
            if replan_attempt > 0:
                self._emit_case_event(case_id, "REPLAN_STARTED",
                                       f"Replanning (attempt {replan_attempt}/{contract.max_replans})...",
                                       "replan")
                self._update_case_status(case_id, CaseStatus.INVESTIGATING)
                plan_steps = await self._run_replanner(case_id, contract, investigation, last_trigger)
                self._persist_plan(case_id, plan_steps, replan_attempt)
                self._emit_case_event(case_id, "REPLAN_COMPLETED",
                                       f"New plan ready: {len(plan_steps)} steps", "replan")

            replan_triggered = False
            last_trigger = ""

            for i, step in enumerate(plan_steps):
                if step.get("status") in ("completed", "skipped"):
                    continue

                if case_id in self._cancelled_cases:
                    self._update_case_status(case_id, CaseStatus.ESCALATED)
                    return {"status": "cancelled", "replans": replan_attempt}

                step["status"] = "executing"
                self._update_plan_step(case_id, i, step)
                self._emit(case_id, "activity",
                           f"Step {i+1}/{len(plan_steps)}: {step['description']}", step.get("step_type", "act"))

                # Human Gate — deterministic policy boundary
                if step.get("requires_approval"):
                    approved = await self._human_gate(case_id, step)
                    if not approved:
                        self._emit_case_event(case_id, "APPROVAL_REJECTED",
                                               "Action rejected by human — triggering replan", "replan")
                        last_trigger = "approval_denied"
                        replan_triggered = True
                        step["status"] = "failed"
                        self._update_plan_step(case_id, i, step)
                        break

                    self._emit_case_event(case_id, "APPROVAL_GRANTED",
                                           "Action approved — proceeding", "act")
                    step["status"] = "completed"
                    step["result"] = {"output": "Approved by human"}
                    self._update_plan_step(case_id, i, step)
                    continue

                # === Execute via Strands ActionAgent ===========================
                self._update_case_status(case_id, CaseStatus.EXECUTING)
                self._emit_case_event(case_id, "ACTION_STARTED",
                                       f"ActionAgent executing: {step['description']}", "act")
                try:
                    result = await self._run_action(case_id, step)
                    step["status"] = "completed"
                    step["result"] = {"output": result[:500] if isinstance(result, str) else str(result)[:500]}
                    self._update_plan_step(case_id, i, step)
                    self._emit_case_event(case_id, "ACTION_COMPLETED",
                                           f"Completed: {step['description']}", "act")
                except Exception as e:
                    logger.exception("Step %s failed: %s", step.get("description"), e)
                    step["status"] = "failed"
                    step["result"] = {"error": str(e)}
                    self._update_plan_step(case_id, i, step)
                    self._emit(case_id, "activity", f"Step failed: {e}", "act")
                    last_trigger = f"action_failure: {e}"
                    replan_triggered = True
                    break

                # Check for replan triggers after each action
                trigger = await self._check_replan_triggers(case_id, contract, step)
                if trigger:
                    last_trigger = trigger
                    replan_triggered = True
                    self._emit_case_event(case_id, "PLAN_INVALIDATED",
                                           f"Plan invalidated: {trigger}", "replan")
                    break

            if not replan_triggered:
                # All steps done — run Verification
                self._update_case_status(case_id, CaseStatus.MONITORING)
                self._emit_case_event(case_id, "VERIFICATION_STARTED",
                                       "VerificationAgent: verifying outcome...", "verify")

                verification = await self._run_verification(case_id, contract)
                recommendation = verification.get("recommendation", "REPLAN")

                if verification.get("verified") and recommendation in ("RESOLVED", "MONITOR"):
                    self._update_case_status(case_id, CaseStatus.RESOLVED)
                    resolved_at = datetime.now().isoformat()
                    conn = get_connection()
                    conn.execute("UPDATE cases SET resolved_at = ? WHERE id = ?",
                                 (resolved_at, case_id))
                    conn.commit()
                    conn.close()
                    self._emit_case_event(case_id, "VERIFICATION_PASSED",
                                           "Verification passed — outcome achieved", "verify")
                    self._emit_case_event(case_id, "CASE_RESOLVED",
                                           "CASE RESOLVED ✓", "verify")
                    return {"status": "resolved", "replans": replan_attempt,
                            "verification": verification}
                else:
                    failed = verification.get("failed_conditions", [])
                    self._emit_case_event(case_id, "VERIFICATION_FAILED",
                                           f"Verification failed: {', '.join(failed) if failed else 'conditions not met'}",
                                           "verify")
                    last_trigger = "verification_failed"
                    replan_triggered = True

        # Max replans exhausted
        self._update_case_status(case_id, CaseStatus.ESCALATED)
        self._emit_case_event(case_id, "CASE_ESCALATED",
                               f"Maximum replans ({contract.max_replans}) exhausted — escalating", "escalate")
        self.broadcast({
            "type": "escalation",
            "case_id": case_id,
            "data": {
                "message": "Maximum replans exhausted. Human intervention required.",
                "replans": contract.max_replans,
            }
        })
        return {"status": "escalated", "replans": contract.max_replans}

    # ── Strands Agent Invocations ──────────────────────────────────────────────

    async def _run_investigator(self, case_id: str, contract: OutcomeContract) -> dict:
        """Run InvestigatorAgent via Strands — returns structured evidence dict."""
        agent = create_investigator_agent(case_id, self.broadcast)

        prompt = f"""Investigate the current business state for this outcome:

Outcome Goal: {contract.goal}
Success Criteria: {contract.success_criteria}
Budget Limit: ₹{contract.max_spend:,.0f}
Deadline: {contract.deadline or 'End of week'}
Constraints: {', '.join(contract.constraints) if contract.constraints else 'None'}

Use the available tools to gather real data. Investigate inventory, suppliers,
and purchase orders. Return a JSON object with inventory_status, risk_level (0-1),
risk_reason, supplier_options, recommended_action, and evidence."""

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: agent(prompt))
            result_text = str(response)
            # Extract JSON from response
            return self._extract_json(result_text, default={
                "risk_level": 0.5,
                "risk_reason": "Investigation completed",
                "supplier_options": [],
                "recommended_action": "review_and_plan",
                "evidence": [result_text[:500]]
            })
        except Exception as e:
            logger.error("InvestigatorAgent error: %s", e)
            return {"risk_level": 0.6, "risk_reason": str(e), "evidence": [str(e)]}

    async def _run_planner(self, case_id: str, contract: OutcomeContract,
                           investigation: dict) -> list[dict]:
        """Run PlannerAgent via Strands — returns structured plan steps."""
        agent = create_planner_agent(case_id, self.broadcast)

        prompt = f"""Create an execution plan for this outcome contract.

Outcome Goal: {contract.goal}
Success Criteria: {contract.success_criteria}
Budget Limit: ₹{contract.max_spend:,.0f} (autonomous limit: ₹10,000 — above this needs approval)
Deadline: {contract.deadline or 'End of week'}
Constraints: {', '.join(contract.constraints) if contract.constraints else 'None'}
Risk Level: {investigation.get('risk_level', 0.5):.0%}
Investigation Findings: {json.dumps(investigation, indent=2)[:1000]}

Use the available tools to confirm current data, then output a JSON array of steps.
Each step: {{"description": str, "tool_name": str, "params": dict,
             "step_type": str, "requires_approval": bool}}

For any purchase over ₹10,000, set requires_approval=true."""

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: agent(prompt))
            result_text = str(response)
            steps = self._extract_json(result_text, default=None)
            if isinstance(steps, list) and steps:
                return steps
            # Fallback to template plan
            return self._template_plan(contract)
        except Exception as e:
            logger.error("PlannerAgent error: %s", e)
            return self._template_plan(contract)

    async def _run_replanner(self, case_id: str, contract: OutcomeContract,
                              investigation: dict, trigger: str) -> list[dict]:
        """Run PlannerAgent with replan context via Strands."""
        agent = create_planner_agent(case_id, self.broadcast)

        prompt = f"""The current plan failed. Generate a new plan.

Outcome Goal: {contract.goal}
Failure Trigger: {trigger}
Budget Limit: ₹{contract.max_spend:,.0f}
Previous Investigation: {json.dumps(investigation, indent=2)[:800]}

The previous approach failed because: {trigger}
Create a NEW plan that avoids the same failure.
Use the available tools to confirm current supplier options and inventory.
Output a JSON array of plan steps. For any purchase over ₹10,000, set requires_approval=true."""

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: agent(prompt))
            result_text = str(response)
            steps = self._extract_json(result_text, default=None)
            if isinstance(steps, list) and steps:
                return steps
            return self._emergency_replan(contract, trigger)
        except Exception as e:
            logger.error("Replanner error: %s", e)
            return self._emergency_replan(contract, trigger)

    async def _run_action(self, case_id: str, step: dict) -> str:
        """Run ActionAgent via Strands for a single step."""
        # Import individual tools directly for deterministic actions
        # The ActionAgent is used for complex multi-step actions.
        # For simple tool calls where the step explicitly names a tool, call directly.
        tool_name = step.get("tool_name", "")
        params = dict(step.get("params", {}))

        # Inject case_id for tools that need it
        if tool_name in ("create_purchase_order", "update_case_status", "log_activity"):
            params.setdefault("case_id", case_id)

        # Direct tool dispatch for known safe tools (no LLM needed for deterministic ops)
        direct_tools = {
            "get_inventory": __import__("backend.app.agent.tools.investigation",
                                        fromlist=["get_inventory"]).get_inventory,
            "get_purchase_order": __import__("backend.app.agent.tools.investigation",
                                              fromlist=["get_purchase_order"]).get_purchase_order,
            "get_supplier": __import__("backend.app.agent.tools.investigation",
                                       fromlist=["get_supplier"]).get_supplier,
            "get_supplier_history": __import__("backend.app.agent.tools.investigation",
                                               fromlist=["get_supplier_history"]).get_supplier_history,
            "get_product": __import__("backend.app.agent.tools.investigation",
                                      fromlist=["get_product"]).get_product,
            "search_alternative_suppliers": __import__("backend.app.agent.tools.search",
                                                        fromlist=["search_alternative_suppliers"]).search_alternative_suppliers,
            "compare_supplier_options": __import__("backend.app.agent.tools.search",
                                                    fromlist=["compare_supplier_options"]).compare_supplier_options,
            "create_purchase_order": __import__("backend.app.agent.tools.action",
                                                 fromlist=["create_purchase_order"]).create_purchase_order,
            "send_email": __import__("backend.app.agent.tools.action",
                                      fromlist=["send_email"]).send_email,
            "update_case_status": __import__("backend.app.agent.tools.action",
                                              fromlist=["update_case_status"]).update_case_status,
            "log_activity": __import__("backend.app.agent.tools.action",
                                        fromlist=["log_activity"]).log_activity,
            "verify_order": __import__("backend.app.agent.tools.verification",
                                        fromlist=["verify_order"]).verify_order,
            "check_delivery_status": __import__("backend.app.agent.tools.verification",
                                                  fromlist=["check_delivery_status"]).check_delivery_status,
            "check_inventory_levels": __import__("backend.app.agent.tools.verification",
                                                   fromlist=["check_inventory_levels"]).check_inventory_levels,
        }

        if tool_name in direct_tools:
            fn = direct_tools[tool_name]
            loop = asyncio.get_event_loop()
            if asyncio.iscoroutinefunction(fn):
                result = await fn(**params)
            else:
                result = await loop.run_in_executor(None, lambda: fn(**params))
            return str(result)

        # Unknown tool — use ActionAgent via Strands to figure out what to do
        agent = create_action_agent(case_id, self.broadcast)
        prompt = f"""Execute this action step:
Description: {step.get('description')}
Tool: {tool_name}
Parameters: {json.dumps(params)}

Execute the action and return a JSON summary: {{"action", "result", "success", "cost", "next_step"}}"""
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: agent(prompt))
        return str(response)

    async def _run_verification(self, case_id: str, contract: OutcomeContract) -> dict:
        """Run VerificationAgent via Strands — returns verification result."""
        agent = create_verification_agent(case_id, self.broadcast)

        prompt = f"""Verify that the business outcome has been achieved.

Outcome Goal: {contract.goal}
Success Criteria: {contract.success_criteria}
Case ID: {case_id}

Use the available tools to:
1. Check current inventory levels
2. Check purchase orders for this case
3. Check delivery status of any orders
4. Verify the success criteria are met

Return a JSON object with: verified (bool), evidence (list), failed_conditions (list),
inventory_after (dict), recommendation (RESOLVED | MONITOR | REPLAN | ESCALATE)"""

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: agent(prompt))
            result_text = str(response)
            result = self._extract_json(result_text, default=None)
            if isinstance(result, dict):
                return result
            # Parse from text
            verified = "verified" in result_text.lower() and "true" in result_text.lower()
            return {
                "verified": verified,
                "evidence": [result_text[:400]],
                "failed_conditions": [] if verified else ["Could not parse verification result"],
                "recommendation": "RESOLVED" if verified else "MONITOR"
            }
        except Exception as e:
            logger.error("VerificationAgent error: %s", e)
            # Check orders as fallback
            orders = query("SELECT * FROM purchase_orders WHERE case_id = ?", (case_id,))
            confirmed = [o for o in orders if o["status"] in ("confirmed", "shipped", "delivered")]
            return {
                "verified": len(confirmed) > 0,
                "evidence": [f"{len(confirmed)} confirmed orders"],
                "failed_conditions": [] if confirmed else ["No confirmed orders"],
                "recommendation": "RESOLVED" if confirmed else "REPLAN"
            }

    # ── Human Gate (Deterministic) ─────────────────────────────────────────────

    async def _human_gate(self, case_id: str, step: dict) -> bool:
        """Deterministic human approval gate.
        
        This is NOT an LLM agent. It:
        1. Stops autonomous execution
        2. Persists the approval request to the database
        3. Streams DECISION_REQUIRED to the frontend
        4. Waits for the backend to receive the human's decision
        5. Resumes execution with the result
        """
        approval_id = f"APR-{uuid.uuid4().hex[:8].upper()}"
        action_type = step.get("params", {}).get("action_type", step.get("tool_name", "action"))
        description = step.get("description", "Action requires approval")
        reason = step.get("params", {}).get("reason",
                          "This action requires human approval per business policy")

        # Calculate cost for approval display
        cost = 0.0
        if step.get("tool_name") == "create_purchase_order":
            params = step.get("params", {})
            qty = int(params.get("quantity", 0))
            sup_id = params.get("supplier_id", "")
            prod_id = params.get("product_id", "")
            if sup_id and prod_id:
                rows = query(
                    "SELECT price_per_unit FROM supplier_products WHERE supplier_id=? AND product_id=?",
                    (sup_id, prod_id)
                )
                if rows:
                    cost = rows[0]["price_per_unit"] * qty

        # Persist approval record
        conn = get_connection()
        conn.execute(
            "INSERT INTO pending_approvals "
            "(id, case_id, action_type, action_details, reason, created_at, status) "
            "VALUES (?,?,?,?,?,?,?)",
            (approval_id, case_id, action_type, json.dumps(step.get("params", {})),
             reason, datetime.now().isoformat(), "pending")
        )
        conn.commit()
        conn.close()

        approval = PendingApproval(
            id=approval_id,
            case_id=case_id,
            action_type=action_type,
            action_details=step.get("params", {}),
            reason=reason,
        )
        self._pending_approvals[approval_id] = approval

        # Create asyncio event for waiting
        event = asyncio.Event()
        self._approval_events[approval_id] = event

        # Update case status
        self._update_case_status(case_id, CaseStatus.AWAITING_APPROVAL)

        # Stream DECISION_REQUIRED to frontend
        self._emit_case_event(case_id, "DECISION_REQUIRED",
                               f"Human approval required: {description}", "escalate")
        self.broadcast({
            "type": "approval_required",
            "case_id": case_id,
            "data": {
                "approval_id": approval_id,
                "action_type": action_type,
                "description": description,
                "reason": reason,
                "cost": cost,
                "details": step.get("params", {}),
                "message": f"₹{cost:,.0f} — {reason}" if cost else reason,
            }
        })

        # STOP AUTONOMOUS EXECUTION — wait for human
        try:
            await asyncio.wait_for(event.wait(), timeout=600)  # 10 min timeout
        except asyncio.TimeoutError:
            self._emit(case_id, "activity", "Approval timed out after 10 minutes", "escalate")
            return False

        # Resume after decision
        approval_record = self._pending_approvals.get(approval_id)
        return approval_record and approval_record.status == ApprovalStatus.APPROVED

    def resolve_approval(self, approval_id: str, decision: str) -> bool:
        """Called by the API when human approves or rejects.
        
        This resumes the waiting agent workflow.
        """
        approval = self._pending_approvals.get(approval_id)
        if not approval:
            return False

        approval.status = ApprovalStatus.APPROVED if decision.lower() == "approve" else ApprovalStatus.REJECTED
        approval.resolved_at = datetime.now().isoformat()

        conn = get_connection()
        conn.execute(
            "UPDATE pending_approvals SET status=?, resolved_at=? WHERE id=?",
            (approval.status.value, approval.resolved_at, approval_id)
        )
        conn.commit()
        conn.close()

        # Signal the waiting coroutine to resume
        event = self._approval_events.get(approval_id)
        if event:
            event.set()

        return True

    def cancel_case(self, case_id: str):
        """Cancel a running case — sets PAUSED flag checked in the loop."""
        self._cancelled_cases.add(case_id)

    def inject_supplier_delay(self, case_id: str):
        """Simulation: inject a supplier delay event to trigger replanning."""
        self._emit_case_event(case_id, "MONITORING_CHECKED",
                               "⚠️ SIMULATION: Supplier reports additional delay!", "replan")
        self.broadcast({
            "type": "simulation_event",
            "case_id": case_id,
            "data": {
                "event": "supplier_delay",
                "message": "Supplier B has reported an additional 3-day delay on delivery",
            }
        })

    # ── Replan Triggers ────────────────────────────────────────────────────────

    async def _check_replan_triggers(self, case_id: str, contract: OutcomeContract,
                                     step: dict) -> Optional[str]:
        """Check if current conditions warrant a replan."""
        # Check if a delayed order exists for this case
        orders = query(
            "SELECT status FROM purchase_orders WHERE case_id=? ORDER BY order_date DESC LIMIT 1",
            (case_id,)
        )
        if orders and orders[0]["status"] == "delayed":
            return "Supplier reported additional delay"

        # Check risk level against threshold
        case_rows = query("SELECT risk_level FROM cases WHERE id=?", (case_id,))
        if case_rows:
            if (case_rows[0]["risk_level"] or 0) > contract.risk_threshold:
                return f"Risk {case_rows[0]['risk_level']:.0%} exceeds threshold {contract.risk_threshold:.0%}"

        return None

    # ── Template Plans (fallback when LLM unreachable) ─────────────────────────

    def _template_plan(self, contract: OutcomeContract) -> list[dict]:
        """Fallback template plan when PlannerAgent is unavailable."""
        goal_lower = contract.goal.lower()
        if any(w in goal_lower for w in ["stock", "inventory", "run out", "shortage", "supplier", "delivery"]):
            return self._supplier_delay_plan(contract)
        elif any(w in goal_lower for w in ["invoice", "bill", "payment"]):
            return self._invoice_plan(contract)
        else:
            return self._generic_plan(contract)

    def _supplier_delay_plan(self, contract: OutcomeContract) -> list[dict]:
        return [
            {"description": "Check current inventory levels", "tool_name": "get_inventory",
             "params": {}, "step_type": "investigate", "requires_approval": False, "status": "pending"},
            {"description": "Check existing purchase orders", "tool_name": "get_purchase_order",
             "params": {}, "step_type": "investigate", "requires_approval": False, "status": "pending"},
            {"description": "Check supplier reliability history", "tool_name": "get_supplier_history",
             "params": {"supplier_id": "SUP-001"}, "step_type": "investigate",
             "requires_approval": False, "status": "pending"},
            {"description": "Search alternative suppliers", "tool_name": "search_alternative_suppliers",
             "params": {"product_id": "PROD-001", "max_delivery_days": 3}, "step_type": "investigate",
             "requires_approval": False, "status": "pending"},
            {"description": "Compare supplier options", "tool_name": "compare_supplier_options",
             "params": {"supplier_ids": "SUP-001,SUP-002,SUP-003", "product_id": "PROD-001", "quantity": 100},
             "step_type": "reason", "requires_approval": False, "status": "pending"},
            {"description": "Request approval for emergency purchase (100 units × ₹445 = ₹44,500)",
             "tool_name": "request_approval",
             "params": {
                 "action_type": "purchase_order",
                 "description": "Emergency purchase: 100 units of Precision Bearing A from Supplier B",
                 "reason": "Stockout projected within 3 days. Cost ₹44,500 exceeds ₹10,000 autonomous limit.",
             },
             "step_type": "escalate", "requires_approval": True, "status": "pending"},
            {"description": "Create purchase order with approved supplier", "tool_name": "create_purchase_order",
             "params": {"supplier_id": "SUP-002", "product_id": "PROD-001", "quantity": 100},
             "step_type": "act", "requires_approval": False, "status": "pending"},
            {"description": "Send order confirmation to supplier", "tool_name": "send_email",
             "params": {
                 "to": "orders@fastsupply.in",
                 "subject": "Emergency Order - Precision Bearing A",
                 "body": "Please confirm emergency order for 100 units of Precision Bearing A.",
             },
             "step_type": "act", "requires_approval": False, "status": "pending"},
            {"description": "Verify order created and confirmed", "tool_name": "verify_order",
             "params": {}, "step_type": "verify", "requires_approval": False, "status": "pending"},
            {"description": "Verify inventory levels will be maintained", "tool_name": "check_inventory_levels",
             "params": {}, "step_type": "verify", "requires_approval": False, "status": "pending"},
        ]

    def _emergency_replan(self, contract: OutcomeContract, trigger: str) -> list[dict]:
        """Emergency replan after original plan fails."""
        return [
            {"description": "Reassess inventory with updated supplier timeline",
             "tool_name": "get_inventory", "params": {},
             "step_type": "investigate", "requires_approval": False, "status": "pending"},
            {"description": "Search emergency local suppliers (1-day delivery)",
             "tool_name": "search_alternative_suppliers",
             "params": {"product_id": "PROD-001", "max_delivery_days": 1},
             "step_type": "investigate", "requires_approval": False, "status": "pending"},
            {"description": "Request emergency purchase approval",
             "tool_name": "request_approval",
             "params": {
                 "action_type": "emergency_purchase_order",
                 "description": "Emergency purchase from local supplier — 4-hour delivery",
                 "reason": f"Original plan failed: {trigger}. Emergency action required.",
             },
             "step_type": "escalate", "requires_approval": True, "status": "pending"},
            {"description": "Create emergency purchase order",
             "tool_name": "create_purchase_order",
             "params": {"supplier_id": "SUP-003", "product_id": "PROD-001", "quantity": 50},
             "step_type": "act", "requires_approval": False, "status": "pending"},
            {"description": "Verify emergency order and inventory",
             "tool_name": "check_inventory_levels",
             "params": {}, "step_type": "verify", "requires_approval": False, "status": "pending"},
        ]

    def _invoice_plan(self, contract: OutcomeContract) -> list[dict]:
        return [
            {"description": "Review invoice and compare with purchase order",
             "tool_name": "get_purchase_order", "params": {},
             "step_type": "investigate", "requires_approval": False, "status": "pending"},
            {"description": "Contact supplier about discrepancy", "tool_name": "send_email",
             "params": {"to": "billing@supplier.in", "subject": "Invoice Discrepancy",
                        "body": "Please review the attached invoice discrepancy."},
             "step_type": "act", "requires_approval": True, "status": "pending"},
            {"description": "Update case status", "tool_name": "update_case_status",
             "params": {"status": "resolved"},
             "step_type": "act", "requires_approval": False, "status": "pending"},
        ]

    def _generic_plan(self, contract: OutcomeContract) -> list[dict]:
        return [
            {"description": "Investigate current situation", "tool_name": "get_inventory",
             "params": {}, "step_type": "investigate", "requires_approval": False, "status": "pending"},
            {"description": "Check purchase orders", "tool_name": "get_purchase_order",
             "params": {}, "step_type": "investigate", "requires_approval": False, "status": "pending"},
            {"description": "Verify current state", "tool_name": "check_inventory_levels",
             "params": {}, "step_type": "verify", "requires_approval": False, "status": "pending"},
        ]

    # ── Database Helpers ───────────────────────────────────────────────────────

    def _update_case_status(self, case_id: str, status: CaseStatus):
        conn = get_connection()
        conn.execute("UPDATE cases SET status=?, updated_at=? WHERE id=?",
                     (status.value, datetime.now().isoformat(), case_id))
        conn.commit()
        conn.close()
        self.broadcast({"type": "case_status_changed", "case_id": case_id,
                         "data": {"status": status.value}})

    def _update_case_risk(self, case_id: str, risk_level: float):
        conn = get_connection()
        conn.execute("UPDATE cases SET risk_level=?, updated_at=? WHERE id=?",
                     (risk_level, datetime.now().isoformat(), case_id))
        conn.commit()
        conn.close()

    def _persist_contract(self, case_id: str, contract: OutcomeContract):
        from backend.app.agent.outcome_contract import contract_to_display
        conn = get_connection()
        conn.execute("UPDATE cases SET outcome_contract=?, updated_at=? WHERE id=?",
                     (json.dumps(contract_to_display(contract)),
                      datetime.now().isoformat(), case_id))
        conn.commit()
        conn.close()

    def _persist_plan(self, case_id: str, steps: list[dict], replan_count: int = 0):
        conn = get_connection()
        # Archive current plan to history
        rows = conn.execute("SELECT current_plan FROM cases WHERE id=?", (case_id,)).fetchone()
        if rows and rows["current_plan"]:
            old_plan = rows["current_plan"]
            history_rows = conn.execute("SELECT plan_history FROM cases WHERE id=?", (case_id,)).fetchone()
            existing = []
            if history_rows and history_rows["plan_history"]:
                try:
                    existing = json.loads(history_rows["plan_history"])
                except Exception:
                    existing = []
            existing.append(json.loads(old_plan))
            conn.execute("UPDATE cases SET plan_history=? WHERE id=?",
                         (json.dumps(existing), case_id))

        conn.execute(
            "UPDATE cases SET current_plan=?, replan_count=?, updated_at=? WHERE id=?",
            (json.dumps(steps), replan_count, datetime.now().isoformat(), case_id)
        )
        conn.commit()
        conn.close()

    def _update_plan_step(self, case_id: str, step_index: int, step: dict):
        conn = get_connection()
        rows = conn.execute("SELECT current_plan FROM cases WHERE id=?", (case_id,)).fetchone()
        if rows and rows["current_plan"]:
            plan = json.loads(rows["current_plan"])
            if step_index < len(plan):
                plan[step_index].update({
                    "status": step.get("status", plan[step_index].get("status")),
                    "result": step.get("result", plan[step_index].get("result")),
                })
                conn.execute(
                    "UPDATE cases SET current_plan=?, updated_at=? WHERE id=?",
                    (json.dumps(plan), datetime.now().isoformat(), case_id)
                )
                conn.commit()
        conn.close()

    # ── JSON Extraction ────────────────────────────────────────────────────────

    @staticmethod
    def _extract_json(text: str, default=None):
        """Extract and parse the first JSON object or array from text."""
        import re
        # Try full parse first
        try:
            return json.loads(text.strip())
        except Exception:
            pass

        # Try code block extraction
        for pattern in [r'```json\s*([\s\S]*?)```', r'```\s*([\s\S]*?)```',
                         r'(\[[\s\S]*\])', r'(\{[\s\S]*\})']:
            match = re.search(pattern, text)
            if match:
                try:
                    return json.loads(match.group(1))
                except Exception:
                    continue

        return default
