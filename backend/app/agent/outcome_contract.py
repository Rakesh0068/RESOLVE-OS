"""Outcome Contract — defines what success looks like for each case."""
import json
from backend.app.models.schemas import OutcomeContract
from backend.app.config import BUSINESS_POLICIES


def generate_outcome_contract(goal: str) -> OutcomeContract:
    """Generate an Outcome Contract from a user's goal statement.
    
    In a full implementation, this would use LLM reasoning to parse the goal
    and extract constraints. For the MVP, we use pattern matching and defaults.
    """
    goal_lower = goal.lower()

    # Detect product focus
    product_keywords = {
        "tea": "PROD-001", "sugar": "PROD-002", "cups": "PROD-003",
        "milk": "PROD-004", "coffee": "PROD-005", "cleaning": "PROD-006",
        "napkins": "PROD-007", "spoons": "PROD-008",
    }

    # Detect scenario type
    is_supplier = any(w in goal_lower for w in ["supplier", "delivery", "late", "delayed", "shipment"])
    is_inventory = any(w in goal_lower for w in ["stock", "inventory", "run out", "shortage"])
    is_invoice = any(w in goal_lower for w in ["invoice", "bill", "payment", "discrepancy"])
    is_complaint = any(w in goal_lower for w in ["complaint", "customer", "unhappy", "refund"])

    # Build constraints based on policies
    constraints = [
        f"Budget < Rs.{BUSINESS_POLICIES['max_autonomous_purchase']:,.0f} for autonomous actions",
        "Don't change primary supplier without approval",
        "Maintain minimum stock levels for all products",
    ]

    escalation_rules = [
        "Approval required for purchases > Rs.10,000",
        "Approval required for supplier changes",
        "Escalate if risk level > 70%",
        "Escalate after maximum replans exhausted",
    ]

    if is_supplier or is_inventory:
        success = "Inventory stays above minimum level until next confirmed delivery"
        if "friday" in goal_lower:
            deadline = "Friday 10:00 AM"
        else:
            deadline = "Within 7 days"
    elif is_invoice:
        success = "Invoice discrepancy resolved — either corrected by supplier or approved with justification"
        deadline = "Within 3 business days"
    elif is_complaint:
        success = "Customer issue resolved satisfactorily, response sent within 24 hours"
        deadline = "Within 24 hours"
    else:
        success = "Goal achieved as stated by the user"
        deadline = None

    return OutcomeContract(
        goal=goal,
        constraints=constraints,
        success_criteria=success,
        escalation_rules=escalation_rules,
        max_replans=BUSINESS_POLICIES.get("max_replans", 3),
        max_spend=BUSINESS_POLICIES["max_autonomous_purchase"],
        max_actions=15,
        deadline=deadline,
        risk_threshold=0.7,
    )


def contract_to_display(contract: OutcomeContract) -> dict:
    """Convert contract to a display-friendly dictionary."""
    return {
        "goal": contract.goal,
        "constraints": contract.constraints,
        "success_criteria": contract.success_criteria,
        "escalation_rules": contract.escalation_rules,
        "budget": f"Rs.{contract.max_spend:,.0f}",
        "max_replans": contract.max_replans,
        "deadline": contract.deadline or "Not set",
        "risk_threshold": f"{contract.risk_threshold:.0%}",
    }
