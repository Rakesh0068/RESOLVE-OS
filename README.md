# ResolveOS

**The Autonomous Operations Agent**

> Don't manage tasks. Give ResolveOS outcomes.

ResolveOS is an AI operations agent that takes a real-world problem, figures out what needs to be done, executes the required actions using tools, monitors the outcome, and only asks the human when a decision or approval is genuinely required.

## Quick Start

### Backend (Python)

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Start the server
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and connects to the backend on `http://localhost:8000`.

## Architecture

```
User -> Goal -> ResolveOS Agent -> Understand -> Plan -> Investigate -> Act -> Verify -> Resolve
```

### Core Components

- **Orchestrator** - Main agent loop with planning, investigation, execution, and replanning
- **Outcome Contract** - Defines goals, constraints, success criteria, and escalation rules
- **Agent Tools** - Investigation, search, action, and verification tools
- **Business Memory** - Stores policies, preferences, and autonomy levels
- **Simulation Engine** - Injects realistic events (supplier delays) for demos

### Agent Tools (10+)

| Tool | Category | Description |
|------|----------|-------------|
| `get_inventory` | Investigation | Check current stock levels |
| `get_purchase_order` | Investigation | View purchase orders |
| `get_supplier` | Investigation | Get supplier details |
| `get_supplier_history` | Investigation | Assess supplier reliability |
| `search_alternative_suppliers` | Search | Find backup suppliers |
| `compare_supplier_options` | Search | Compare pricing and delivery |
| `create_purchase_order` | Action | Place orders with suppliers |
| `send_email` | Action | Contact suppliers/customers |
| `verify_order` | Verification | Confirm order status |
| `check_inventory_levels` | Verification | Verify stock safety |

### Replan Triggers

The agent replans when:
1. An action fails
2. New information invalidates the current plan
3. Risk level increases significantly
4. Verification fails

Replans are bounded (max 3) with an autonomy budget.

## Demo Scenario: Supplier Delay

1. User submits: *"The supplier says our tea leaves delivery will be late by 3 days."*
2. Agent generates Outcome Contract (goal, budget, constraints)
3. Plans 11 steps: investigate -> search -> compare -> approve -> execute -> verify
4. Discovers stockout risk (120 units, 40/day usage, 5 days to delivery)
5. Finds alternatives: Supplier B (Rs.445/unit, 2 days)
6. Requests approval (exceeds Rs.10,000 autonomous limit)
7. Human approves -> PO created -> email sent -> order verified
8. **CASE RESOLVED**

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, TypeScript
- **Backend**: Python, FastAPI, SQLite
- **Agent**: Strands Agents SDK (with local compatibility layer)
- **Real-time**: WebSocket for live activity feed

## Project Structure

```
RESOLVE-OS/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── config.py         # Settings
│   │   ├── models/           # Pydantic schemas + SQLite
│   │   ├── agent/            # Orchestrator, tools, planner
│   │   ├── api/              # REST endpoints
│   │   ├── services/         # Case management, simulation
│   │   └── data/             # Seed data
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/              # Pages (Dashboard, Case Detail)
│   │   ├── components/       # UI components
│   │   ├── lib/              # API client, WebSocket
│   │   └── types/            # TypeScript types
│   └── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/cases` | List all cases |
| POST | `/api/cases` | Create a new case |
| GET | `/api/cases/:id` | Get case details |
| POST | `/api/cases/:id/run` | Start agent on a case |
| POST | `/api/cases/:id/approve` | Approve pending action |
| POST | `/api/cases/:id/reject` | Reject pending action |
| WS | `/ws` | Real-time activity feed |
