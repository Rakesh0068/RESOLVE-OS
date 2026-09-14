"""ResolveOS Data Models"""
from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
import uuid


def gen_id(prefix: str = "CASE") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"


# ── Enums ──────────────────────────────────────────────

class CaseStatus(str, Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    PLANNING = "planning"
    AWAITING_APPROVAL = "awaiting_approval"
    EXECUTING = "executing"
    MONITORING = "monitoring"
    RESOLVED = "resolved"
    ESCALATED = "escalated"


class StepType(str, Enum):
    INVESTIGATE = "investigate"
    PLAN = "plan"
    ACT = "act"
    VERIFY = "verify"
    ESCALATE = "escalate"
    REPLAN = "replan"
    REASON = "reason"


class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    DELAYED = "delayed"
    CANCELLED = "cancelled"


# ── Core Models ────────────────────────────────────────

class Product(BaseModel):
    id: str
    name: str
    category: str = ""
    unit_price: float  # Rs.
    minimum_stock: int
    current_stock: int
    daily_consumption: float
    unit: str = "units"


class Supplier(BaseModel):
    id: str
    name: str
    contact_email: str = ""
    contact_phone: str = ""
    reliability_score: float = 0.8  # 0-1
    average_delivery_days: int = 3
    notes: str = ""


class SupplierProduct(BaseModel):
    supplier_id: str
    product_id: str
    price_per_unit: float
    delivery_days: int
    min_order_quantity: int = 1


class PurchaseOrder(BaseModel):
    id: str = Field(default_factory=lambda: gen_id("PO"))
    supplier_id: str
    supplier_name: str = ""
    product_id: str
    product_name: str = ""
    quantity: int
    total_cost: float
    order_date: str = Field(default_factory=lambda: datetime.now().isoformat())
    expected_delivery: str
    actual_delivery: Optional[str] = None
    status: OrderStatus = OrderStatus.PENDING
    case_id: Optional[str] = None


class PlanStep(BaseModel):
    id: str = Field(default_factory=lambda: gen_id("STEP"))
    description: str
    tool_name: str
    params: dict = {}
    step_type: str = "investigate"  # investigate, plan, act, verify, escalate, replan, reason
    status: str = "pending"  # pending, executing, completed, failed, skipped
    requires_approval: bool = False
    result: Optional[dict] = None


class OutcomeContract(BaseModel):
    goal: str
    constraints: list[str] = []
    success_criteria: str
    escalation_rules: list[str] = []
    max_replans: int = 3
    max_spend: float = 10000.0
    max_actions: int = 15
    deadline: Optional[str] = None
    risk_threshold: float = 0.7


class Case(BaseModel):
    id: str = Field(default_factory=lambda: gen_id("CASE"))
    title: str
    goal: str
    status: CaseStatus = CaseStatus.OPEN
    risk_level: float = 0.0
    outcome_contract: Optional[OutcomeContract] = None
    current_plan: list[PlanStep] = []
    plan_history: list[list[PlanStep]] = []
    actions_taken: list[dict] = []
    replan_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    resolved_at: Optional[str] = None


class ActivityEvent(BaseModel):
    id: str = Field(default_factory=lambda: gen_id("EVT"))
    case_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    message: str
    step_type: StepType
    details: Optional[dict] = None


class PendingApproval(BaseModel):
    id: str = Field(default_factory=lambda: gen_id("APR"))
    case_id: str
    action_type: str
    action_details: dict
    reason: str
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    status: ApprovalStatus = ApprovalStatus.PENDING
    resolved_at: Optional[str] = None


# ── API Request/Response Models ────────────────────────

class CreateCaseRequest(BaseModel):
    goal: str


class ApprovalRequest(BaseModel):
    decision: str  # "approve" or "reject"


class DashboardStats(BaseModel):
    total_cases: int
    resolved: int
    monitoring: int
    needs_decision: int
    active: int


class WSMessage(BaseModel):
    type: str  # activity, approval_required, case_updated
    case_id: str
    data: dict
