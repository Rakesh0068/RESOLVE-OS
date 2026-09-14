"""WebSocket API — real-time event streaming."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.app.services.events import event_bus

router = APIRouter(tags=["websocket"])


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time activity feed.
    
    Clients connect here to receive live updates about agent activity,
    approval requests, and case status changes.
    """
    await event_bus.connect(websocket)

    # Send recent history to newly connected client
    history = event_bus.get_history(limit=50)
    if history:
        await websocket.send_json({"type": "history", "data": {"events": history}})

    try:
        while True:
            # Keep connection alive, listen for client messages
            data = await websocket.receive_text()
            # Client can send pings or requests
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        event_bus.disconnect(websocket)
    except Exception:
        event_bus.disconnect(websocket)
