"""Direct test of the orchestrator."""
import sys
import asyncio
sys.path.insert(0, '.')

from backend.app.data.seed import seed_database
from backend.app.agent.orchestrator import Orchestrator
from backend.app.services import case_service

# Seed database
seed_database()

# Create a case
case = case_service.create_case(
    "Supplier delivery delay",
    "The supplier says our tea leaves delivery will be late by 3 days. Make sure we dont run out of stock."
)
print(f"Created case: {case['id']}")

# Create orchestrator with console broadcast
def broadcast(event):
    data = event.get('data', {})
    print(f"  [{event.get('type', '?')}] {data.get('message', event)}")

orch = Orchestrator(broadcast_fn=broadcast)

# Run the orchestrator
try:
    result = asyncio.run(orch.resolve(case['id'], case['goal']))
    print(f"\nResult: {result}")
except Exception as e:
    import traceback
    print(f"\nError: {e}")
    traceback.print_exc()
