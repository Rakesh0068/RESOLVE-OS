"""Case Service — manages case lifecycle."""
import json
from datetime import datetime
from backend.app.models.schemas import Case, CaseStatus, ActivityEvent, PendingApproval, DashboardStats
from backend.app.models.database import get_connection, query


def create_case(title: str, goal: str) -> dict:
    """Create a new case and return it as a dict."""
    case_id = f"CASE-{datetime.now().strftime('%H%M%S')}-{hash(goal) % 1000:03d}"
    now = datetime.now().isoformat()

    conn = get_connection()
    conn.execute(
        """INSERT INTO cases (id, title, goal, status, risk_level, current_plan, 
           plan_history, actions_taken, replan_count, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
        (case_id, title, goal, "open", 0.0, "[]", "[]", "[]", 0, now, now)
    )
    conn.commit()
    conn.close()

    return {"id": case_id, "title": title, "goal": goal, "status": "open", "created_at": now}


def get_case(case_id: str) -> dict | None:
    """Get a case with all its details."""
    rows = query("SELECT * FROM cases WHERE id = ?", (case_id,))
    if not rows:
        return None

    case = dict(rows[0])

    # Parse JSON fields
    if case.get("outcome_contract"):
        case["outcome_contract"] = json.loads(case["outcome_contract"])
    if case.get("current_plan"):
        case["current_plan"] = json.loads(case["current_plan"])
    if case.get("plan_history"):
        case["plan_history"] = json.loads(case["plan_history"])
    if case.get("actions_taken"):
        case["actions_taken"] = json.loads(case["actions_taken"])

    # Get activity log
    case["activity_log"] = query(
        "SELECT * FROM activity_log WHERE case_id = ? ORDER BY timestamp ASC",
        (case_id,)
    )

    # Get pending approvals
    approvals = query(
        "SELECT * FROM pending_approvals WHERE case_id = ? ORDER BY created_at DESC",
        (case_id,)
    )
    case["pending_approvals"] = approvals

    return case


def list_cases(status: str = None) -> list[dict]:
    """List all cases, optionally filtered by status."""
    if status:
        rows = query("SELECT * FROM cases WHERE status = ? ORDER BY updated_at DESC", (status,))
    else:
        rows = query("SELECT * FROM cases ORDER BY updated_at DESC")

    cases = []
    for row in rows:
        c = dict(row)
        if c.get("current_plan"):
            plan = json.loads(c["current_plan"])
            completed = sum(1 for s in plan if s.get("status") == "completed")
            c["plan_progress"] = f"{completed}/{len(plan)}"
        else:
            c["plan_progress"] = "0/0"
        cases.append(c)

    return cases


def get_dashboard_stats() -> dict:
    """Get summary stats for the dashboard."""
    all_cases = query("SELECT status FROM cases")

    total = len(all_cases)
    resolved = sum(1 for c in all_cases if c["status"] == "resolved")
    monitoring = sum(1 for c in all_cases if c["status"] == "monitoring")
    needs_decision = sum(1 for c in all_cases if c["status"] == "awaiting_approval")
    active = total - resolved

    return {
        "total_cases": total,
        "resolved": resolved,
        "monitoring": monitoring,
        "needs_decision": needs_decision,
        "active": active,
    }


def update_case_status(case_id: str, status: str, risk_level: float = None) -> bool:
    """Update a case's status."""
    conn = get_connection()
    if risk_level is not None:
        conn.execute(
            "UPDATE cases SET status = ?, risk_level = ?, updated_at = ? WHERE id = ?",
            (status, risk_level, datetime.now().isoformat(), case_id)
        )
    else:
        conn.execute(
            "UPDATE cases SET status = ?, updated_at = ? WHERE id = ?",
            (status, datetime.now().isoformat(), case_id)
        )
    conn.commit()
    conn.close()
    return True


def get_pending_approval(approval_id: str) -> dict | None:
    """Get a pending approval by ID."""
    rows = query("SELECT * FROM pending_approvals WHERE id = ?", (approval_id,))
    if rows:
        r = dict(rows[0])
        if r.get("action_details"):
            r["action_details"] = json.loads(r["action_details"])
        return r
    return None


def list_pending_approvals() -> list[dict]:
    """List all pending approvals."""
    rows = query("SELECT * FROM pending_approvals WHERE status = 'pending' ORDER BY created_at DESC")
    results = []
    for r in rows:
        d = dict(r)
        if d.get("action_details"):
            d["action_details"] = json.loads(d["action_details"])
        results.append(d)
    return results
