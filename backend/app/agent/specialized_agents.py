"""Specialized Strands Agents for ResolveOS.

Each agent is a real strands.Agent instance with a focused role,
a curated set of tools, and a strict system prompt.

Architecture:
  ResolveOS Orchestrator
      ├── PlannerAgent      (read-only reasoning + policy check)
      ├── InvestigatorAgent (read-only data gathering tools)
      ├── ActionAgent       (write tools, gated by policy)
      └── VerificationAgent (read-only verification tools)

The orchestrator coordinates them sequentially / with replanning logic.
Human Gate is deterministic (not an agent) — it pauses execution and waits
for a real backend approval event before resuming.
"""
import json
import logging
from typing import Optional, Callable

from strands import Agent

from backend.app.agent.model_factory import create_model
from backend.app.agent.tools.investigation import (
    get_inventory, get_purchase_order, get_supplier,
    get_supplier_history, get_product,
)
from backend.app.agent.tools.search import (
    search_alternative_suppliers, compare_supplier_options,
)
from backend.app.agent.tools.action import (
    create_purchase_order, send_email, update_case_status, log_activity,
)
from backend.app.agent.tools.verification import (
    verify_order, check_delivery_status, check_inventory_levels,
)

logger = logging.getLogger(__name__)


# ── System Prompts ─────────────────────────────────────────────────────────────

PLANNER_PROMPT = """You are the ResolveOS Planner Agent.

Your role: Given an Outcome Contract (goal, constraints, budget, deadline), produce a
structured JSON execution plan. You MUST use the available tools to gather real data
before creating the plan — do not invent numbers.

Rules:
- Use get_inventory and get_supplier tools to ground your plan in real data.
- Output a JSON array of steps. Each step: {"description", "tool_name", "params", 
  "step_type", "requires_approval"}.
- step_type values: investigate | reason | act | verify | escalate | replan
- Mark requires_approval=true for any action where total cost > 10000 INR, or any
  external communication, or any irreversible action.
- Do NOT include approval steps for read-only investigation steps.
- Be concise. Plan only what is needed to satisfy the outcome contract.
- Output ONLY the JSON array. No prose before or after it."""

INVESTIGATOR_PROMPT = """You are the ResolveOS Investigator Agent.

Your role: Investigate the current business state and return a structured summary
of findings. You ONLY use read-only tools. Never suggest or execute actions.

Investigate:
1. Current inventory levels and stockout risk
2. Existing purchase orders and their status
3. Supplier reliability and available options
4. Projected timeline to meet the outcome goal

Output a JSON object:
{
  "inventory_status": {...},
  "risk_level": 0.0-1.0,
  "risk_reason": "...",
  "supplier_options": [...],
  "recommended_action": "...",
  "evidence": [...]
}"""

ACTION_AGENT_PROMPT = """You are the ResolveOS Action Agent.

Your role: Execute approved business actions. You NEVER execute an action that:
- Exceeds the approved budget
- Was not approved by the human gate (if required)
- Is irreversible without explicit confirmation

When executing:
1. Call the appropriate action tool.
2. Record the result.
3. Return a JSON summary: {"action", "result", "success", "cost", "next_step"}

If a tool fails, report the failure clearly and suggest alternatives."""

VERIFICATION_PROMPT = """You are the ResolveOS Verification Agent.

Your role: After an action has been taken, verify that the ACTUAL BUSINESS OUTCOME
was achieved — not just that the action ran.

Verification checklist:
1. Was the purchase order created and confirmed?
2. Is inventory on track to stay above minimum?
3. Is the supplier timeline compatible with the deadline?
4. Are all success conditions from the Outcome Contract satisfied?

Output a JSON object:
{
  "verified": true/false,
  "evidence": [...],
  "failed_conditions": [...],
  "inventory_after": {...},
  "recommendation": "RESOLVED | MONITOR | REPLAN | ESCALATE"
}"""


# ── Agent Factory ──────────────────────────────────────────────────────────────

def _make_event_callback(broadcast_fn: Optional[Callable], case_id: str, agent_name: str):
    """Create a Strands callback_handler that streams events to the frontend."""

    def callback_handler(**kwargs):
        # Strands calls this with various event types
        event_type = None
        message = None

        # Tool start/complete events
        if "tool_use" in kwargs and kwargs.get("tool_use"):
            tool_use = kwargs["tool_use"]
            tool_name = tool_use.get("name", "tool")
            event_type = "TOOL_STARTED"
            message = f"{agent_name}: calling {tool_name}..."

        elif "tool_result" in kwargs and kwargs.get("tool_result"):
            event_type = "TOOL_COMPLETED"
            message = f"{agent_name}: tool completed"

        # Text streaming  
        elif "data" in kwargs and kwargs.get("data"):
            # partial text — don't broadcast every token, skip
            return

        if event_type and broadcast_fn:
            broadcast_fn({
                "type": "agent_event",
                "case_id": case_id,
                "data": {
                    "event": event_type,
                    "agent": agent_name,
                    "message": message,
                }
            })

    return callback_handler


def create_planner_agent(case_id: str, broadcast_fn: Optional[Callable] = None) -> Agent:
    """Create the Planner Agent with read-only investigation tools."""
    model = create_model()
    return Agent(
        model=model,
        system_prompt=PLANNER_PROMPT,
        tools=[get_inventory, get_supplier, get_supplier_history, get_product,
               search_alternative_suppliers, compare_supplier_options],
        callback_handler=_make_event_callback(broadcast_fn, case_id, "PlannerAgent"),
        name="PlannerAgent",
    )


def create_investigator_agent(case_id: str, broadcast_fn: Optional[Callable] = None) -> Agent:
    """Create the Investigator Agent — read-only tools only."""
    model = create_model()
    return Agent(
        model=model,
        system_prompt=INVESTIGATOR_PROMPT,
        tools=[get_inventory, get_purchase_order, get_supplier,
               get_supplier_history, get_product,
               search_alternative_suppliers, compare_supplier_options],
        callback_handler=_make_event_callback(broadcast_fn, case_id, "InvestigatorAgent"),
        name="InvestigatorAgent",
    )


def create_action_agent(case_id: str, broadcast_fn: Optional[Callable] = None) -> Agent:
    """Create the Action Agent — write tools gated by policy."""
    model = create_model()
    return Agent(
        model=model,
        system_prompt=ACTION_AGENT_PROMPT,
        tools=[create_purchase_order, send_email, update_case_status, log_activity,
               # Also give read access so it can verify before acting
               get_inventory, get_purchase_order],
        callback_handler=_make_event_callback(broadcast_fn, case_id, "ActionAgent"),
        name="ActionAgent",
    )


def create_verification_agent(case_id: str, broadcast_fn: Optional[Callable] = None) -> Agent:
    """Create the Verification Agent — read-only verification tools."""
    model = create_model()
    return Agent(
        model=model,
        system_prompt=VERIFICATION_PROMPT,
        tools=[verify_order, check_delivery_status, check_inventory_levels,
               get_inventory, get_purchase_order],
        callback_handler=_make_event_callback(broadcast_fn, case_id, "VerificationAgent"),
        name="VerificationAgent",
    )
