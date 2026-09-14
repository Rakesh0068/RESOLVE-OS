"""Actions API — endpoints for approvals, rejections, and triggering agent runs."""
from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import ApprovalRequest
from backend.app.services import case_service

router = APIRouter(prefix="/api", tags=["actions"])


@router.get("/approvals")
def list_approvals():
    """List all pending approvals."""
    approvals = case_service.list_pending_approvals()
    return {"approvals": approvals, "count": len(approvals)}


@router.get("/approvals/{approval_id}")
def get_approval(approval_id: str):
    """Get a specific pending approval."""
    approval = case_service.get_pending_approval(approval_id)
    if not approval:
        raise HTTPException(status_code=404, detail=f"Approval {approval_id} not found")
    return approval


@router.post("/approvals/{approval_id}")
def resolve_approval(approval_id: str, request: ApprovalRequest):
    """Approve or reject a pending action."""
    from backend.app.models.database import get_connection
    from datetime import datetime

    approval = case_service.get_pending_approval(approval_id)
    if not approval:
        raise HTTPException(status_code=404, detail=f"Approval {approval_id} not found")

    if approval["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Approval already {approval['status']}")

    # Update in database
    status = "approved" if request.decision.lower() == "approve" else "rejected"
    conn = get_connection()
    conn.execute(
        "UPDATE pending_approvals SET status = ?, resolved_at = ? WHERE id = ?",
        (status, datetime.now().isoformat(), approval_id)
    )
    conn.commit()
    conn.close()

    # Notify the orchestrator if it's waiting
    # This will be handled through the orchestrator's approval mechanism
    from backend.app.main import orchestrator
    if orchestrator:
        orchestrator.resolve_approval(approval_id, request.decision)

    return {"id": approval_id, "status": status, "decision": request.decision}
