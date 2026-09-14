"""Business Memory — stores policies, preferences, and learned behavior."""
from backend.app.config import BUSINESS_POLICIES


class BusinessMemory:
    """Stores and retrieves business policies and preferences.
    
    In a full implementation, this would persist to a database and
    learn from past decisions. For the MVP, it uses config-based defaults.
    """

    def __init__(self):
        self.policies = BUSINESS_POLICIES.copy()
        self.decision_history: list[dict] = []

    def get_policy(self, key: str) -> any:
        return self.policies.get(key)

    def set_policy(self, key: str, value: any):
        self.policies[key] = value

    def can_autonomously_purchase(self, amount: float) -> bool:
        """Check if a purchase amount is within autonomous limits."""
        return amount <= self.policies["max_autonomous_purchase"]

    def requires_approval(self, action_type: str, details: dict = None) -> bool:
        """Determine if an action requires human approval.
        
        Policy rules (deterministic — NOT LLM-evaluated):
        - Any purchase over autonomous limit requires approval
        - All external communications (send_email) require approval
        - Supplier changes always require approval
        - Refunds over max_auto_refund require approval
        - Irreversible actions require approval
        """
        details = details or {}

        # Large purchases
        if action_type in ("purchase_order", "create_purchase_order"):
            amount = details.get("total_cost", 0) or details.get("amount", 0)
            if not self.can_autonomously_purchase(amount):
                return True

        # External communications always require approval
        if action_type in ("send_email", "external_communication", "contact_supplier"):
            return True

        # Supplier changes
        if action_type == "change_supplier":
            return self.policies.get("never_change_supplier_without_approval", True)

        # Refunds
        if action_type == "refund":
            amount = details.get("amount", 0)
            if amount > self.policies.get("max_auto_refund", 5000):
                return True

        # Irreversible actions
        if action_type in ("cancel_order", "delete_record", "emergency_purchase_order"):
            return True

        return False

    def get_preferred_supplier(self, product_category: str = None) -> str:
        """Get the preferred supplier name."""
        preferred = self.policies.get("preferred_suppliers", [])
        return preferred[0] if preferred else None

    def should_notify(self, event_type: str, risk_level: float = 0) -> bool:
        """Check if the owner should be notified for this event."""
        notify_rules = self.policies.get("notify_owner_when", [])
        if "approval_required" in notify_rules and event_type == "approval_required":
            return True
        if "risk_above_70" in notify_rules and risk_level > 0.7:
            return True
        if "failure_occurs" in notify_rules and event_type == "failure":
            return True
        return False

    def record_decision(self, case_id: str, action: str, outcome: str):
        """Record a decision for future reference."""
        self.decision_history.append({
            "case_id": case_id,
            "action": action,
            "outcome": outcome,
        })

    def get_summary(self) -> str:
        """Get a human-readable summary of business policies."""
        return (
            f"Business Policies:\n"
            f"  Max autonomous purchase: Rs.{self.policies['max_autonomous_purchase']:,.0f}\n"
            f"  Max auto refund: Rs.{self.policies.get('max_auto_refund', 5000):,.0f}\n"
            f"  Preferred suppliers: {', '.join(self.policies.get('preferred_suppliers', []))}\n"
            f"  Change supplier requires approval: {self.policies.get('never_change_supplier_without_approval', True)}\n"
            f"  Communication preference: {self.policies.get('preferred_communication', 'email')}\n"
            f"  Notify when: {', '.join(self.policies.get('notify_owner_when', []))}"
        )
