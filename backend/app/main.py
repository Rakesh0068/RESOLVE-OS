"""ResolveOS — FastAPI Application Entry Point."""
import asyncio
import json
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.app.config import HOST, PORT, CORS_ORIGINS
from backend.app.models.database import init_db
from backend.app.data.seed import seed_database
from backend.app.services.events import event_bus
from backend.app.services.simulation import SimulationEngine
from backend.app.services import case_service
from backend.app.agent.orchestrator import Orchestrator

# Import routers
from backend.app.api.cases import router as cases_router
from backend.app.api.actions import router as actions_router


# ── Global State ───────────────────────────────────────

orchestrator: Orchestrator = None
simulation: SimulationEngine = None


# ── Lifespan ───────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and services on startup."""
    global orchestrator, simulation

    print("[START] ResolveOS starting up...")
    seed_database()
    print("[OK] Database seeded")

    # Initialize orchestrator with WebSocket broadcast
    orchestrator = Orchestrator(broadcast_fn=lambda e: asyncio.create_task(event_bus.broadcast(e)))
    simulation = SimulationEngine(orchestrator)
    print("[OK] Agent orchestrator initialized")
    print("[OK] WebSocket hub ready")

    yield

    print("[STOP] ResolveOS shutting down...")


# ── App ────────────────────────────────────────────────

app = FastAPI(
    title="ResolveOS",
    description="The Autonomous Operations Agent",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(cases_router)
app.include_router(actions_router)


# ── Endpoints ──────────────────────────────────────────

@app.get("/api/stats")
def get_stats():
    """Dashboard statistics."""
    return case_service.get_dashboard_stats()


@app.post("/api/cases/{case_id}/run")
async def run_case(case_id: str, background_tasks: BackgroundTasks):
    """Start the agent to resolve a case."""
    case = case_service.get_case(case_id)
    if not case:
        return {"error": "Case not found"}

    # Update status
    case_service.update_case_status(case_id, "investigating")

    # Run agent in background
    async def _run():
        try:
            result = await orchestrator.resolve(case_id, case["goal"])
            print(f"Case {case_id} result: {result}")
        except Exception as e:
            import traceback
            print(f"Case {case_id} error: {e}")
            traceback.print_exc()
            case_service.update_case_status(case_id, "escalated")

    background_tasks.add_task(_run)

    # Start simulation for demo (triggers replan after 15s)
    if simulation:
        simulation.start_simulation(case_id, "supplier_delay")

    return {"case_id": case_id, "status": "started", "message": "Agent is working on your case"}


@app.post("/api/cases/{case_id}/approve")
async def approve_case_action(case_id: str):
    """Quick approve — approve the latest pending action for this case."""
    approvals = case_service.list_pending_approvals()
    case_approvals = [a for a in approvals if a["case_id"] == case_id]

    if not case_approvals:
        return {"error": "No pending approvals for this case"}

    approval_id = case_approvals[0]["id"]
    from backend.app.models.database import get_connection
    conn = get_connection()
    conn.execute(
        "UPDATE pending_approvals SET status = 'approved', resolved_at = ? WHERE id = ?",
        (datetime.now().isoformat(), approval_id)
    )
    conn.commit()
    conn.close()

    if orchestrator:
        orchestrator.resolve_approval(approval_id, "approve")

    return {"approval_id": approval_id, "status": "approved"}


@app.post("/api/cases/{case_id}/reject")
async def reject_case_action(case_id: str):
    """Quick reject — reject the latest pending action for this case."""
    approvals = case_service.list_pending_approvals()
    case_approvals = [a for a in approvals if a["case_id"] == case_id]

    if not case_approvals:
        return {"error": "No pending approvals for this case"}

    approval_id = case_approvals[0]["id"]
    from backend.app.models.database import get_connection
    conn = get_connection()
    conn.execute(
        "UPDATE pending_approvals SET status = 'rejected', resolved_at = ? WHERE id = ?",
        (datetime.now().isoformat(), approval_id)
    )
    conn.commit()
    conn.close()

    if orchestrator:
        orchestrator.resolve_approval(approval_id, "reject")

    return {"approval_id": approval_id, "status": "rejected"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await event_bus.connect(websocket)

    # Send recent history
    history = event_bus.get_history(limit=50)
    if history:
        await websocket.send_json({"type": "history", "data": {"events": history}})

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        event_bus.disconnect(websocket)
    except Exception:
        event_bus.disconnect(websocket)


@app.get("/")
def root():
    return {
        "name": "ResolveOS",
        "version": "0.1.0",
        "description": "The Autonomous Operations Agent",
        "status": "running",
    }


# ── Main ───────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=HOST, port=PORT, reload=True)
