"""Planner — generates and replans agent execution plans."""
import json
from backend.app.models.schemas import PlanStep, OutcomeContract
from backend.app.models.database import query


def generate_plan(contract: OutcomeContract) -> list[PlanStep]:
    """Generate an execution plan based on the outcome contract.
    
    For the MVP, this uses template-based planning with adjustments
    based on the contract type. A production version would use LLM reasoning.
    """
    goal_lower = contract.goal.lower()

    # Detect scenario type
    is_supplier = any(w in goal_lower for w in ["supplier", "delivery", "late", "delayed"])
    is_inventory = any(w in goal_lower for w in ["stock", "inventory", "run out", "shortage"])
    is_invoice = any(w in goal_lower for w in ["invoice", "bill", "payment", "discrepancy"])
    is_complaint = any(w in goal_lower for w in ["complaint", "customer"])

    if is_supplier or is_inventory:
        return _supplier_delay_plan(contract)
    elif is_invoice:
        return _invoice_discrepancy_plan(contract)
    elif is_complaint:
        return _customer_complaint_plan(contract)
    else:
        return _generic_plan(contract)


def _supplier_delay_plan(contract: OutcomeContract) -> list[PlanStep]:
    """Plan for handling a supplier delay / stockout prevention."""
    return [
        PlanStep(
            description="Check current inventory levels",
            tool_name="get_inventory",
            params={},
            step_type="investigate",
        ),
        PlanStep(
            description="Check existing purchase orders",
            tool_name="get_purchase_order",
            params={},
            step_type="investigate",
        ),
        PlanStep(
            description="Calculate projected shortage",
            tool_name="log_activity",
            params={"message": "Calculating projected stockout based on current inventory and daily consumption", "step_type": "reason"},
            step_type="reason",
        ),
        PlanStep(
            description="Check supplier history and reliability",
            tool_name="get_supplier_history",
            params={"supplier_id": "SUP-001"},
            step_type="investigate",
        ),
        PlanStep(
            description="Search alternative suppliers",
            tool_name="search_alternative_suppliers",
            params={"product_id": "PROD-001", "max_delivery_days": 7},
            step_type="investigate",
        ),
        PlanStep(
            description="Compare supplier options",
            tool_name="compare_supplier_options",
            params={"supplier_ids": "SUP-001,SUP-002,SUP-003", "product_id": "PROD-001", "quantity": 100},
            step_type="reason",
        ),
        PlanStep(
            description="Request human approval for emergency purchase",
            tool_name="request_approval",
            params={
                "action_type": "purchase_order",
                "description": "Emergency purchase of 100 units from QuickMart Local",
                "reason": "Original supplier delayed, stockout projected within 3 days",
            },
            requires_approval=True,
            step_type="escalate",
        ),
        PlanStep(
            description="Create purchase order with approved supplier",
            tool_name="create_purchase_order",
            params={"supplier_id": "SUP-003", "product_id": "PROD-001", "quantity": 100},
            step_type="act",
        ),
        PlanStep(
            description="Send order confirmation email to supplier",
            tool_name="send_email",
            params={
                "to": "rush@quickmart.in",
                "subject": "Emergency Order - Premium Tea Leaves",
                "body": "Please confirm receipt of emergency order for 100 packets of Premium Tea Leaves.",
            },
            step_type="act",
        ),
        PlanStep(
            description="Verify order was created and confirmed",
            tool_name="verify_order",
            params={},
            step_type="verify",
        ),
        PlanStep(
            description="Check updated inventory levels",
            tool_name="check_inventory_levels",
            params={},
            step_type="verify",
        ),
    ]


def _invoice_discrepancy_plan(contract: OutcomeContract) -> list[PlanStep]:
    """Plan for handling an invoice discrepancy."""
    return [
        PlanStep(
            description="Review the uploaded invoice",
            tool_name="log_activity",
            params={"message": "Analyzing uploaded invoice for discrepancies", "step_type": "investigate"},
            step_type="investigate",
        ),
        PlanStep(
            description="Compare invoice with purchase order",
            tool_name="get_purchase_order",
            params={},
            step_type="investigate",
        ),
        PlanStep(
            description="Calculate discrepancy amount",
            tool_name="log_activity",
            params={"message": "Calculating difference between invoice and PO amounts", "step_type": "reason"},
            step_type="reason",
        ),
        PlanStep(
            description="Check supplier history for billing patterns",
            tool_name="get_supplier_history",
            params={"supplier_id": "SUP-001"},
            step_type="investigate",
        ),
        PlanStep(
            description="Contact supplier about discrepancy",
            tool_name="send_email",
            params={
                "to": "billing@supplier.in",
                "subject": "Invoice Discrepancy - PO #XXXX",
                "body": "We have identified a discrepancy between your invoice and our purchase order. Please review.",
            },
            requires_approval=True,
            step_type="escalate",
        ),
        PlanStep(
            description="Update case with resolution",
            tool_name="update_case_status",
            params={"status": "resolved"},
            step_type="act",
        ),
    ]


def _customer_complaint_plan(contract: OutcomeContract) -> list[PlanStep]:
    """Plan for handling a customer complaint."""
    return [
        PlanStep(
            description="Review customer complaint details",
            tool_name="log_activity",
            params={"message": "Reviewing customer complaint and order history", "step_type": "investigate"},
            step_type="investigate",
        ),
        PlanStep(
            description="Check customer order history",
            tool_name="get_purchase_order",
            params={},
            step_type="investigate",
        ),
        PlanStep(
            description="Draft response to customer",
            tool_name="log_activity",
            params={"message": "Drafting appropriate response based on complaint type", "step_type": "reason"},
            step_type="reason",
        ),
        PlanStep(
            description="Send response to customer",
            tool_name="send_email",
            params={
                "to": "customer@example.com",
                "subject": "Regarding Your Recent Concern",
                "body": "Thank you for bringing this to our attention. We are looking into it.",
            },
            requires_approval=True,
            step_type="escalate",
        ),
        PlanStep(
            description="Update case status",
            tool_name="update_case_status",
            params={"status": "resolved"},
            step_type="act",
        ),
    ]


def _generic_plan(contract: OutcomeContract) -> list[PlanStep]:
    """Generic fallback plan."""
    return [
        PlanStep(
            description="Investigate the current situation",
            tool_name="get_inventory",
            params={},
            step_type="investigate",
        ),
        PlanStep(
            description="Analyze findings and determine action",
            tool_name="log_activity",
            params={"message": "Analyzing data to determine best course of action", "step_type": "reason"},
            step_type="reason",
        ),
        PlanStep(
            description="Request approval for action",
            tool_name="log_activity",
            params={"message": "Determining if human approval is needed", "step_type": "escalate"},
            requires_approval=True,
            step_type="escalate",
        ),
        PlanStep(
            description="Execute approved action",
            tool_name="log_activity",
            params={"message": "Executing action based on investigation", "step_type": "act"},
            step_type="act",
        ),
        PlanStep(
            description="Verify resolution",
            tool_name="check_inventory_levels",
            params={},
            step_type="verify",
        ),
    ]


def replan(contract: OutcomeContract, previous_plan: list[PlanStep], trigger: str) -> list[PlanStep]:
    """Generate a new plan after a replan trigger.
    
    The replan adapts the plan based on what went wrong.
    """
    goal_lower = contract.goal.lower()
    is_supplier = any(w in goal_lower for w in ["supplier", "delivery", "late", "delayed"])

    if is_supplier and "delay" in trigger.lower():
        # Supplier delay replan: try emergency local supplier
        return [
            PlanStep(
                description="Recalculate inventory shortage with updated timeline",
                tool_name="get_inventory",
                params={},
                step_type="investigate",
            ),
            PlanStep(
                description="Search for local emergency suppliers with same-day delivery",
                tool_name="search_alternative_suppliers",
                params={"product_id": "PROD-001", "max_delivery_days": 1},
                step_type="investigate",
            ),
            PlanStep(
                description="Compare emergency supplier options",
                tool_name="compare_supplier_options",
                params={"supplier_ids": "SUP-003", "product_id": "PROD-001", "quantity": 50},
                step_type="reason",
            ),
            PlanStep(
                description="Request approval for emergency purchase",
                tool_name="log_activity",
                params={
                    "message": "Original plan failed — requesting approval for emergency local supplier",
                    "step_type": "escalate",
                },
                requires_approval=True,
                step_type="escalate",
            ),
            PlanStep(
                description="Create emergency purchase order",
                tool_name="create_purchase_order",
                params={"supplier_id": "SUP-003", "product_id": "PROD-001", "quantity": 50},
                step_type="act",
            ),
            PlanStep(
                description="Send confirmation and monitor",
                tool_name="send_email",
                params={
                    "to": "rush@quickmart.in",
                    "subject": "URGENT: Emergency Tea Leaves Order",
                    "body": "Please prioritize this emergency order. Confirm ASAP.",
                },
                step_type="act",
            ),
            PlanStep(
                description="Verify emergency order",
                tool_name="verify_order",
                params={},
                step_type="verify",
            ),
        ]

    # Generic replan
    return [
        PlanStep(
            description="Reassess situation after plan failure",
            tool_name="get_inventory",
            params={},
            step_type="investigate",
        ),
        PlanStep(
            description="Determine alternative approach",
            tool_name="log_activity",
            params={"message": "Previous plan failed, generating alternative approach", "step_type": "replan"},
            step_type="reason",
        ),
        PlanStep(
            description="Execute alternative action",
            tool_name="log_activity",
            params={"message": "Executing alternative plan", "step_type": "act"},
            step_type="act",
        ),
        PlanStep(
            description="Verify outcome",
            tool_name="check_inventory_levels",
            params={},
            step_type="verify",
        ),
    ]
