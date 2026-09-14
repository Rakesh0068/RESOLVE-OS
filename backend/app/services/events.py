"""Event System — manages WebSocket connections and broadcasting."""
import asyncio
import json
from typing import Set
from fastapi import WebSocket


class EventBus:
    """Manages WebSocket connections and broadcasts events to all connected clients."""

    def __init__(self):
        self._connections: Set[WebSocket] = set()
        self._event_history: list[dict] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self._connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self._connections.discard(websocket)

    async def broadcast(self, event: dict):
        """Broadcast an event to all connected clients."""
        self._event_history.append(event)
        # Keep only last 500 events
        if len(self._event_history) > 500:
            self._event_history = self._event_history[-500:]

        message = json.dumps(event)
        disconnected = set()

        for ws in self._connections:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.add(ws)

        self._connections -= disconnected

    def get_history(self, case_id: str = None, limit: int = 50) -> list[dict]:
        """Get recent event history, optionally filtered by case_id."""
        events = self._event_history
        if case_id:
            events = [e for e in events if e.get("case_id") == case_id]
        return events[-limit:]

    @property
    def connection_count(self) -> int:
        return len(self._connections)


# Global event bus instance
event_bus = EventBus()
