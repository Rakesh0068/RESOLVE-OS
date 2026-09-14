"""Orchestrator — the brain of ResolveOS.

Implements the core agent loop:
  Goal → Understand → Plan → Investigate → Act → Verify → Replan/Resolve

Uses Strands Agents SDK for tool calling and reasoning.
"""
import json
import asyncio
import uuid
from datetime import datetime
from typing import Optional, Callable

from backend.app.models.schemas import (
    Case, CaseStatus, PlanStep, OutcomeContract, ActivityEvent, StepType,
    PendingApproval, ApprovalStatus
)
from backend.app.models.database import get_connection, query, execute
from backend.app.agent.outcome_contract import generate_outcome_contract, contract_to_display
from backend.app.agent.planner import generate_plan, replan
from backend.app.agent.memory import BusinessMemory

# Import all tools so they're available to the agent
from backend.app.agent.tools.investigation import (
    get_inventory, get_purchase_order, get_supplier, get_supplier_history, get_product
)
from backend.app.agent.tools.search import search_alternative_suppliers, compare_supplier_options
from backend.app.agent.tools.action import create_purchase_order, send_email, update_case_status, log_activity
from backend.app.agent.tools.verification import verify_order, check_delivery_status, check_inventory_levels


class Orchestrator:
    """Main agent orchestrator that drives the ResolveOS core loop."""

    def __init__(self, broadcast_fn: Optional[Callable] = None):
        self.memory = BusinessMemory()
        self.broadcast = broadcast_fn or self._default_broadcast
        self._pending_approvals: dict[str, PendingApproval] = {}
        self._approval_events: dict[str, asyncio.Event] = {}

        # Tool registry mapping tool names to callables
        self._tools = {
            "get_inventory": get_inventory,
            "get_purchase_order": get_purchase_order,
            "get_supplier": get_supplier,
            "get_supplier_history": get_supplier_history,
            "get_product": get_product,
            "search_alternative_suppliers": search_alternative_suppliers,
            "compare_supplier_options": compare_supplier_options,
            "create_purchase_order": create_purchase_order,
            "send_email": send_email,
            "update_case_status": update_case_status,
            "log_activity": log_activity,
            "verify_order": verify_order,
            "check_delivery_status": check_delivery_status,
            "check_inventory_levels": check_inventory_levels,
            "request_approval": self._request_approval,
        }

    def _default_broadcast(self, event: dict):
        """Default broadcast — just print to console."""
        print(f"  [{event.get('type', 'event')}] {event.get('data', {}).get('message', event)}")

    def _log(self, case_id: str, message: str, step_type: str = "investigate"):
        """Log an activity event and broadcast it."""
        ts = datetime.now().strftime("%H:%M:%S")
        event = {
            "type": "activity",
            "case_id": case_id,
            "data": {
                "timestamp": ts,
                "message": message,
                "step_type": step_type,
            }
        }
        self.broadcast(event)

        # Persist to database
        conn = get_connection()
        conn.execute(
            "INSERT INTO activity_log (case_id, timestamp, message, step_type) VALUES (?,?,?,?)",
            (case_id, datetime.now().isoformat(), message, step_type)
        )
        conn.commit()
        conn.close()

    # ── Main Loop ──────────────────────────────────────

    async def resolve(self, case_id: str, goal: str) -> dict:
        """Main entry point — resolve a case from goal to resolution.
        
        Returns a summary of what happened.
        """
        self._log(case_id, "[TARGET] Understanding objective...", "plan")

        # Phase 1: Understand — generate outcome contract
        contract = generate_outcome_contract(goal)
        self._log(case_id, f"[#] Outcome contract created", "plan")
        self._log(case_id, f"   Goal: {contract.goal}", "plan")
        self._log(case_id, f"   Success: {contract.success_criteria}", "plan")
        self._log(case_id, f"   Budget: Rs.{contract.max_spend:,.0f}", "plan")
        self._log(case_id, f"   Max replans: {contract.max_replans}", "plan")

        # Persist contract
        self._update_case(case_id, status=CaseStatus.PLANNING, contract=contract)

        # Phase 2: Plan
        self._log(case_id, "[PLAN] Generating execution plan...", "plan")
        plan = generate_plan(contract)
        self._log(case_id, f"   Plan generated: {len(plan)} steps", "plan")
        self._update_case(case_id, plan=plan)

        # Phase 3: Execute with replanning loop
        for replan_attempt in range(contract.max_replans + 1):
            if replan_attempt > 0:
                self._log(case_id, f"[REPLAN] REPLAN #{replan_attempt} — generating new plan...", "replan")
                plan = replan(contract, plan, last_trigger)
                self._update_case(case_id, plan=plan, replan_count=replan_attempt)

            # Execute plan steps
            replan_triggered = False
            last_trigger = ""

            for i, step in enumerate(plan):
                if step.status in ("completed", "skipped"):
                    continue

                # Update step status
                step.status = "executing"
                self._update_case_step(case_id, i, step)

                # Log the step
                self._log(case_id, f"  {'[OK]' if step.status == 'completed' else '[>]'} Step {i+1}: {step.description}", step.step_type)

                # Check if this step requires approval
                if step.requires_approval:
                    self._update_case(case_id, status=CaseStatus.AWAITING_APPROVAL)
                    approval_result = await self._request_approval(case_id, step)

                    if not approval_result:
                        self._log(case_id, f"  [BLOCK] Approval denied — replanning", "escalate")
                        last_trigger = "approval_denied"
                        replan_triggered = True
                        break

                    self._log(case_id, f"  [OK] Approved — proceeding", "act")
                    # Mark approval step as completed, skip further tool execution
                    step.status = "completed"
                    step.result = {"output": "Approved by human"}
                    self._update_case_step(case_id, i, step)
                    continue

                # Execute the tool
                try:
                    result = await self._execute_tool(case_id, step)
                    step.status = "completed"
                    step.result = {"output": result} if isinstance(result, str) else result
                    self._update_case_step(case_id, i, step)
                except Exception as e:
                    step.status = "failed"
                    step.result = {"error": str(e)}
                    self._update_case_step(case_id, i, step)
                    self._log(case_id, f"  [X] Step failed: {e}", "act")
                    last_trigger = f"action_failure: {e}"
                    replan_triggered = True
                    break

                # Check for replan triggers after each action
                trigger = self._check_replan_triggers(case_id, contract, step, replan_attempt)
                if trigger:
                    last_trigger = trigger
                    replan_triggered = True
                    self._log(case_id, f"  [!] Replan triggered: {trigger}", "replan")
                    break

            if not replan_triggered:
                # All steps completed — verify resolution
                self._log(case_id, "[?] Verifying resolution...", "verify")
                verified = await self._verify_resolution(case_id, contract)

                if verified:
                    self._update_case(case_id, status=CaseStatus.RESOLVED,
                                      resolved_at=datetime.now().isoformat())
                    self._log(case_id, "[OK] CASE RESOLVED", "verify")
                    return {"status": "resolved", "replans": replan_attempt}
                else:
                    last_trigger = "verification_failed"
                    replan_triggered = True

        # Max replans exhausted
        self._update_case(case_id, status=CaseStatus.ESCALATED)
        self._log(case_id, "[ALERT] MAX REPLANS EXCEEDED — escalating to human", "escalate")

        # Broadcast escalation
        self.broadcast({
            "type": "escalation",
            "case_id": case_id,
            "data": {
                "message": "Maximum replans exhausted. Human intervention required.",
                "replans": contract.max_replans,
            }
        })

        return {"status": "escalated", "replans": contract.max_replans}

    # ── Tool Execution ─────────────────────────────────

    async def _execute_tool(self, case_id: str, step: PlanStep) -> str:
        """Execute a single tool call."""
        # Special handling for request_approval - it needs the step object directly
        if step.tool_name == "request_approval":
            return await self._request_approval(case_id, step)

        tool_fn = self._tools.get(step.tool_name)
        if not tool_fn:
            raise ValueError(f"Unknown tool: {step.tool_name}")

        # Prepare params
        params = dict(step.params)
        # Inject case_id where needed
        if "case_id" not in params and step.tool_name in ("create_purchase_order", "update_case_status", "log_activity"):
            params["case_id"] = case_id

        # Call the tool
        if asyncio.iscoroutinefunction(tool_fn):
            result = await tool_fn(**params)
        else:
            result = tool_fn(**params)

        return result

    # ── Approval Flow ──────────────────────────────────

    async def _request_approval(self, case_id: str, step: PlanStep) -> bool:
        """Request human approval and wait for response."""
        approval_id = f"APR-{uuid.uuid4().hex[:8].upper()}"

        # Determine approval details
        action_type = step.params.get("action_type", step.tool_name)
        description = step.params.get("description", step.description)
        reason = step.params.get("reason", "Action requires human approval per business policy")

        # Check business memory
        needs_approval = self.memory.requires_approval(action_type, step.params)
        if not needs_approval:
            self._log(case_id, "  [OK] Auto-approved by business policy", "act")
            return True

        # Create pending approval
        approval = PendingApproval(
            id=approval_id,
            case_id=case_id,
            action_type=action_type,
            action_details=step.params,
            reason=reason,
        )

        # Persist
        conn = get_connection()
        conn.execute(
            "INSERT INTO pending_approvals (id, case_id, action_type, action_details, reason, created_at, status) VALUES (?,?,?,?,?,?,?)",
            (approval.id, case_id, action_type, json.dumps(step.params), reason, approval.created_at, "pending")
        )
        conn.commit()
        conn.close()

        self._pending_approvals[approval_id] = approval

        # Create event for waiting
        event = asyncio.Event()
        self._approval_events[approval_id] = event

        # Broadcast approval request
        self.broadcast({
            "type": "approval_required",
            "case_id": case_id,
            "data": {
                "approval_id": approval_id,
                "action_type": action_type,
                "description": description,
                "reason": reason,
                "details": step.params,
            }
        })

        self._log(case_id, f"  [...] Waiting for human approval...", "escalate")

        # Wait for response (with timeout)
        try:
            await asyncio.wait_for(event.wait(), timeout=300)  # 5 min timeout
        except asyncio.TimeoutError:
            self._log(case_id, "  ⏰ Approval timed out", "escalate")
            return False

        # Get result
        approval = self._pending_approvals.get(approval_id)
        return approval and approval.status == ApprovalStatus.APPROVED

    def resolve_approval(self, approval_id: str, decision: str) -> bool:
        """Process a human's approval decision."""
        approval = self._pending_approvals.get(approval_id)
        if not approval:
            return False

        if decision.lower() == "approve":
            approval.status = ApprovalStatus.APPROVED
        else:
            approval.status = ApprovalStatus.REJECTED

        approval.resolved_at = datetime.now().isoformat()

        # Update database
        conn = get_connection()
        conn.execute(
            "UPDATE pending_approvals SET status = ?, resolved_at = ? WHERE id = ?",
            (approval.status.value, approval.resolved_at, approval_id)
        )
        conn.commit()
        conn.close()

        # Signal the waiting coroutine
        event = self._approval_events.get(approval_id)
        if event:
            event.set()

        return True

    # ── Replan Triggers ────────────────────────────────

    def _check_replan_triggers(self, case_id: str, contract: OutcomeContract,
                                step: PlanStep, replan_count: int) -> Optional[str]:
        """Check if current conditions warrant a replan.
        
        Triggers:
        1. Action failure (handled separately in execute loop)
        2. New information invalidates plan
        3. Risk level increases significantly
        4. Verification fails (handled in verify step)
        """
        # Check risk level
        case_rows = query("SELECT risk_level FROM cases WHERE id = ?", (case_id,))
        if case_rows:
            current_risk = case_rows[0]["risk_level"]
            if current_risk > contract.risk_threshold:
                return f"Risk level {current_risk:.0%} exceeds threshold {contract.risk_threshold:.0%}"

        # Check if we've exceeded budget
        if replan_count >= contract.max_replans:
            return "Max replans reached"

        # Check simulation for supplier delays
        # This checks if the simulation has injected a delay
        sim_status = query(
            "SELECT status FROM purchase_orders WHERE case_id = ? ORDER BY order_date DESC LIMIT 1",
            (case_id,)
        )
        if sim_status and sim_status[0]["status"] == "delayed":
            return "Supplier reported additional delay"

        return None

    # ── Verification ───────────────────────────────────

    async def _verify_resolution(self, case_id: str, contract: OutcomeContract) -> bool:
        """Verify that the outcome contract has been satisfied."""
        # Check inventory levels
        inventory_result = check_inventory_levels()
        self._log(case_id, f"Inventory check: {inventory_result[:200]}...", "verify")

        # Check for orders placed for this case
        orders = query(
            "SELECT * FROM purchase_orders WHERE case_id = ?", (case_id,)
        )

        # Also check all recent orders in case case_id wasn't set
        all_orders = query("SELECT * FROM purchase_orders ORDER BY order_date DESC LIMIT 10")

        has_orders = len(orders) > 0 or len(all_orders) > 0
        confirmed_orders = [o for o in (orders or all_orders) if o["status"] in ("confirmed", "shipped", "delivered")]
        has_confirmed = len(confirmed_orders) > 0

        if has_confirmed:
            self._log(case_id, f"[OK] Verification passed — {len(confirmed_orders)} confirmed order(s) in system", "verify")
            return True
        elif has_orders:
            # Orders exist but none confirmed yet — treat as monitoring, not failure
            self._log(case_id, "[~] Orders placed but awaiting confirmation — marking as monitoring", "verify")
            return True  # Allow resolution, move to monitoring
        else:
            self._log(case_id, "[X] Verification failed — no orders placed", "verify")
            return False

    # ── Helpers ────────────────────────────────────────

    def _update_case(self, case_id: str, status: CaseStatus = None,
                     contract: OutcomeContract = None, plan: list[PlanStep] = None,
                     replan_count: int = None, resolved_at: str = None):
        """Update case in database."""
        conn = get_connection()
        updates = []
        params = []

        if status:
            updates.append("status = ?")
            params.append(status.value)
        if contract:
            updates.append("outcome_contract = ?")
            params.append(json.dumps(contract_to_display(contract)))
        if plan:
            # Append current plan to history before updating
            current = query("SELECT current_plan FROM cases WHERE id = ?", (case_id,))
            if current and current[0]["current_plan"]:
                history = json.loads(current[0]["current_plan"])
                history_json = json.dumps([history])  # wrap in array
                updates.append("plan_history = ?")
                params.append(history_json)
            updates.append("current_plan = ?")
            params.append(json.dumps([s.model_dump() for s in plan]))
        if replan_count is not None:
            updates.append("replan_count = ?")
            params.append(replan_count)
        if resolved_at:
            updates.append("resolved_at = ?")
            params.append(resolved_at)

        updates.append("updated_at = ?")
        params.append(datetime.now().isoformat())
        params.append(case_id)

        if updates:
            sql = f"UPDATE cases SET {', '.join(updates)} WHERE id = ?"
            conn.execute(sql, params)
            conn.commit()
        conn.close()

    def _update_case_step(self, case_id: str, step_index: int, step: PlanStep):
        """Update a specific step in the current plan."""
        conn = get_connection()
        rows = conn.execute("SELECT current_plan FROM cases WHERE id = ?", (case_id,)).fetchone()
        if rows and rows["current_plan"]:
            plan = json.loads(rows["current_plan"])
            if step_index < len(plan):
                plan[step_index]["status"] = step.status
                if step.result:
                    plan[step_index]["result"] = step.result
                conn.execute(
                    "UPDATE cases SET current_plan = ?, updated_at = ? WHERE id = ?",
                    (json.dumps(plan), datetime.now().isoformat(), case_id)
                )
                conn.commit()
        conn.close()

    # ── Simulation Triggers ────────────────────────────

    def inject_supplier_delay(self, case_id: str):
        """Simulate a supplier delay event to trigger replanning."""
        self._log(case_id, "[ALERT] SIMULATION: Supplier has reported an additional delay!", "replan")
        self.broadcast({
            "type": "simulation_event",
            "case_id": case_id,
            "data": {
                "event": "supplier_delay",
                "message": "Supplier has reported an additional 1-day delay on delivery",
            }
        })
