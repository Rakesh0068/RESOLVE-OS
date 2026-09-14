"""Cases API — REST endpoints for case management."""
from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import CreateCaseRequest
from backend.app.services import case_service

router = APIRouter(prefix="/api/cases", tags=["cases"])


@router.get("")
def list_cases(status: str = None):
    """List all cases with optional status filter."""
    cases = case_service.list_cases(status)
    return {"cases": cases, "count": len(cases)}


@router.get("/{case_id}")
def get_case(case_id: str):
    """Get a specific case with full details."""
    case = case_service.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return case


@router.post("")
def create_case(request: CreateCaseRequest):
    """Create a new case from a user goal."""
    # Generate a title from the goal
    goal = request.goal
    if len(goal) > 60:
        title = goal[:57] + "..."
    else:
        title = goal

    case = case_service.create_case(title, goal)
    return case
