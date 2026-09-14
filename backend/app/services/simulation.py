"""Simulation Engine — injects realistic events for demo purposes."""
import asyncio
import random
from datetime import datetime, timedelta
from backend.app.models.database import query, get_connection


class SimulationEngine:
    """Simulates real-world events (supplier delays, delivery updates, etc.)
    to demonstrate the agent's replanning capabilities.
    """

    def __init__(self, orchestrator=None):
        self.orchestrator = orchestrator
        self._active_simulations: dict[str, asyncio.Task] = {}

    async def simulate_supplier_delay(self, case_id: str, delay_seconds: float = 10):
        """Simulate a supplier delay after a short delay.
        
        This is the key demo feature — shows the agent replanning.
        """
        await asyncio.sleep(delay_seconds)

        # Update purchase order status to delayed
        conn = get_connection()
        conn.execute(
            """UPDATE purchase_orders SET status = 'delayed' 
               WHERE case_id = ? AND status IN ('confirmed', 'shipped')""",
            (case_id,)
        )
        conn.commit()
        conn.close()

        # Update risk level
        conn = get_connection()
        conn.execute(
            "UPDATE cases SET risk_level = 0.85, updated_at = ? WHERE id = ?",
            (datetime.now().isoformat(), case_id)
        )
        conn.commit()
        conn.close()

        if self.orchestrator:
            self.orchestrator.inject_supplier_delay(case_id)

        return {"event": "supplier_delay", "case_id": case_id}

    async def simulate_delivery_update(self, case_id: str, status: str = "in_transit"):
        """Simulate a delivery status update."""
        conn = get_connection()
        conn.execute(
            """UPDATE purchase_orders SET status = ?
               WHERE case_id = ? AND status NOT IN ('cancelled', 'delayed')""",
            (status, case_id)
        )
        conn.commit()
        conn.close()

        return {"event": "delivery_update", "case_id": case_id, "status": status}

    async def simulate_delivery_complete(self, case_id: str):
        """Simulate successful delivery completion."""
        conn = get_connection()
        conn.execute(
            """UPDATE purchase_orders SET status = 'delivered', actual_delivery = ?
               WHERE case_id = ? AND status != 'cancelled'""",
            (datetime.now().isoformat(), case_id)
        )
        conn.commit()
        conn.close()

        # Update inventory
        orders = query(
            "SELECT product_id, quantity FROM purchase_orders WHERE case_id = ? AND status = 'delivered'",
            (case_id,)
        )
        for order in orders:
            conn = get_connection()
            conn.execute(
                "UPDATE products SET current_stock = current_stock + ? WHERE id = ?",
                (order["quantity"], order["product_id"])
            )
            conn.commit()
            conn.close()

        return {"event": "delivery_complete", "case_id": case_id}

    def start_simulation(self, case_id: str, scenario: str = "supplier_delay"):
        """Start a simulation for a case."""
        if scenario == "supplier_delay":
            task = asyncio.create_task(self.simulate_supplier_delay(case_id, delay_seconds=15))
            self._active_simulations[case_id] = task
        elif scenario == "delivery_update":
            task = asyncio.create_task(self.simulate_delivery_update(case_id))
            self._active_simulations[case_id] = task

    def stop_simulation(self, case_id: str):
        """Stop a running simulation."""
        task = self._active_simulations.pop(case_id, None)
        if task:
            task.cancel()
