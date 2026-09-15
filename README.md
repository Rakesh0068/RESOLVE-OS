# ResolveOS

**Don't manage tasks. Resolve outcomes.**

ResolveOS is an autonomous operations agent for small and medium businesses, built for the **AWS Strands Agents Hackathon**.

---

## 60-Second Pitch

> "ResolveOS doesn't automate tasks. It owns outcomes.
>
> We use AWS Strands Agents as the autonomous orchestration layer. The user gives an outcome. Strands coordinates specialized agents and tools. The agent investigates the business state, creates a plan, checks policy, and — when a decision crosses the autonomy boundary — pauses for a human. When external conditions change, Strands replans. Finally, a verification agent proves the outcome was actually achieved."

---

## Why Strands

AWS Strands Agents SDK is the **actual runtime** for ResolveOS's autonomy. It is not a cosmetic import.

| Without Strands | With Strands |
|----------------|--------------|
| If/else logic decides what to do | `strands.Agent` reasons over tool results |
| Tools are called by hardcoded dispatch | Bedrock model selects tools based on context |
| Replanning is a status flag | `PlannerAgent` creates a new plan via LLM reasoning |
| Verification is a boolean check | `VerificationAgent` uses tools + LLM to assess outcome |

Each specialized agent is a `strands.Agent(model=BedrockModel, tools=[...])` instance.
The model reasons, decides which tools to call, executes them, and uses the results.

---

## Architecture

```
User
  │
  ▼
Next.js / React (TypeScript + Tailwind)
  │  WebSocket / SSE (real-time events)
  ▼
FastAPI (Python)
  │
  ▼
ResolveOS Orchestrator
  │  Coordinates the multi-agent workflow
  ├──► PlannerAgent (strands.Agent)
  │    • Tools: get_inventory, get_supplier, search_alternative_suppliers
  │    • Creates structured plan via LLM reasoning over real data
  │
  ├──► InvestigatorAgent (strands.Agent)
  │    • Tools: get_inventory, get_purchase_order, get_supplier, get_supplier_history
  │    • Read-only — discovers facts, never invents data
  │
  ├──► ActionAgent (strands.Agent)
  │    • Tools: create_purchase_order, send_email, update_case_status
  │    • Write tools gated by Policy Engine
  │
  └──► VerificationAgent (strands.Agent)
       • Tools: verify_order, check_delivery_status, check_inventory_levels
       • Proves the OUTCOME was achieved, not just the action ran
  │
  ▼
Policy Engine (deterministic — NOT an LLM)
  • ₹10,000 autonomous purchase limit
  • External communication always requires approval
  • Supplier changes always require approval
  │
  ▼
Human Gate (deterministic)
  • Pauses the Strands workflow
  • Persists WAITING_FOR_APPROVAL state to DynamoDB/SQLite
  • Streams DECISION_REQUIRED to frontend
  • Resumes only on real backend approval
  │
  ▼
AWS Services
  ├── Amazon Bedrock     → Foundation model (nova-lite / claude)
  ├── Strands Agents     → Agent orchestration framework
  ├── DynamoDB           → Business state persistence
  ├── S3                 → Documents and attachments
  ├── EventBridge        → Monitoring and scheduling
  ├── Lambda             → Event-driven processing
  └── SES                → Supplier/customer communication
```

---

## Strands Implementation

### How Strands Powers the Agent Workflow

```python
# Real Strands Agent — not a wrapper or shim
from strands import Agent, tool
from strands.models import BedrockModel

@tool
def get_inventory(product_id: str = None) -> str:
    """Get current inventory levels from the database."""
    # Real database query — Strands calls this when the model decides to
    ...

investigator = Agent(
    model=BedrockModel(model_id="us.amazon.nova-lite-v1:0"),
    tools=[get_inventory, get_supplier, get_purchase_order, ...],
    system_prompt="Investigate the business state. Use tools. Return evidence.",
)

# The Strands agent loop:
# 1. Send prompt + tools to Bedrock
# 2. Bedrock decides whether to call a tool
# 3. Tool executes against real database
# 4. Result feeds back into the model context
# 5. Model continues until done
response = investigator("Investigate: will we run out of tea leaves this week?")
```

### Multi-Agent Coordination

```
Outcome Goal
     │
     ▼ strands.Agent (InvestigatorAgent)
     │   → get_inventory() → "120 units, 8/day, 15 days left"
     │   → get_supplier_history("SUP-001") → "3 recent delays"
     │   Returns: {"risk_level": 0.85, "risk_reason": "supplier unreliable"}
     │
     ▼ strands.Agent (PlannerAgent)
     │   → search_alternative_suppliers() → "SUP-002: 2-day, 97% reliable"
     │   → compare_supplier_options() → "SUP-002 best for deadline"
     │   Returns: JSON plan with 10 steps
     │
     ▼ Policy Engine (deterministic)
     │   Total cost: ₹44,500 > ₹10,000 limit
     │   → REQUIRES_APPROVAL
     │
     ▼ Human Gate (pauses Strands workflow)
     │   Frontend shows approval UI
     │   Human approves
     │   asyncio.Event.set() → workflow resumes
     │
     ▼ strands.Agent (ActionAgent)
     │   → create_purchase_order("SUP-002", "PROD-001", 100)
     │   → send_email("orders@supplier.in", "Emergency Order", ...)
     │
     ▼ Monitoring: supplier delays detected
     │   → PLAN_INVALIDATED
     │
     ▼ strands.Agent (PlannerAgent) — REPLANNING
     │   Generates new plan using emergency supplier
     │
     ▼ strands.Agent (VerificationAgent)
         → verify_order() → "PO confirmed"
         → check_inventory_levels() → "120+ units secured"
         Returns: {"verified": true, "recommendation": "RESOLVED"}
```

### Case State Machine

```
CREATED → UNDERSTANDING → PLANNING → INVESTIGATING
    → WAITING_FOR_APPROVAL → EXECUTING → MONITORING
    → VERIFYING → REPLANNING → RESOLVED / FAILED / ESCALATED
```

`WAITING_FOR_APPROVAL` survives process restart (persisted to database).

---

## Demo Scenario

**Northstar Components — Precision Bearing A**

| Field | Value |
|-------|-------|
| Product | Precision Bearing A |
| Current inventory | 120 units |
| Daily usage | 40 units |
| Minimum stock | 40 units |
| Projected stockout | **3 days** |
| Supplier A | ₹420/unit, 5-day delivery, 92% reliable |
| Supplier B | ₹445/unit, **2-day** delivery, 97% reliable |
| Supplier C | ₹390/unit, 8-day delivery, 89% reliable |

**What the agent does:**
1. Discovers the stockout risk via `InvestigatorAgent`
2. `PlannerAgent` recommends Supplier B (best deadline/reliability)
3. Total: 100 × ₹445 = **₹44,500** → exceeds ₹10,000 limit → **APPROVAL REQUIRED**
4. Human approves → `ActionAgent` creates purchase order
5. Supplier B reports **2-day → 5-day delay** (simulation event)
6. `PLAN_INVALIDATED` → `REPLANNING` begins
7. Emergency supplier found: 4-hour delivery at ₹470/unit
8. Second approval → emergency order placed
9. `VerificationAgent` confirms delivery and inventory
10. **CASE RESOLVED** ✓

---

## Local Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- AWS credentials (for Bedrock) OR a local LLM via Ollama

### Backend

```bash
# 1. Clone and enter the project
git clone https://github.com/Rakesh0068/RESOLVE-OS.git
cd RESOLVE-OS

# 2. Install Python dependencies
pip install -r backend/requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env: set AWS_REGION and Bedrock credentials, OR set LITELLM_API_BASE for local LLM

# 4. Start the backend
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Running Without AWS (Local LLM)

```bash
# Option 1: Ollama
ollama pull mistral
LITELLM_API_BASE=http://localhost:11434/v1 LITELLM_MODEL=openai/mistral \
  python -m uvicorn backend.app.main:app --port 8000 --reload

# Option 2: LM Studio
# Start LM Studio, load a model, enable server
LITELLM_API_BASE=http://localhost:1234/v1 LITELLM_MODEL=openai/mistral-7b \
  python -m uvicorn backend.app.main:app --port 8000 --reload
```

---

## AWS Setup

### IAM Permissions Required

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
        "dynamodb:Query", "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/resolveos-*"
    }
  ]
}
```

### Supported Bedrock Models

```bash
# Fast and cost-efficient (default)
BEDROCK_MODEL_ID=us.amazon.nova-lite-v1:0

# Higher reasoning quality
BEDROCK_MODEL_ID=us.amazon.nova-pro-v1:0

# Claude (best reasoning, higher cost)
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-haiku-20241022-v1:0
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-5
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AWS_REGION` | For Bedrock | `us-east-1` | AWS region |
| `AWS_ACCESS_KEY_ID` | For Bedrock | (from ~/.aws) | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | For Bedrock | (from ~/.aws) | AWS secret |
| `BEDROCK_MODEL_ID` | No | `us.amazon.nova-lite-v1:0` | Bedrock model |
| `LITELLM_API_BASE` | For local | - | Local LLM endpoint |
| `LITELLM_MODEL` | For local | `openai/mistral` | LiteLLM model |
| `HOST` | No | `0.0.0.0` | Server bind host |
| `PORT` | No | `8000` | Server port |

---

## Running Tests

```bash
# All tests (requires LLM for full suite)
python -m pytest backend/tests/ -v

# Synchronous tests only (no LLM required)
python -m pytest backend/tests/test_strands_integration.py \
  -k "not strands_agent_with and not full_case and not human_gate" -v

# The required Strands integration test (proves real agents run)
python -m pytest backend/tests/test_strands_integration.py::test_strands_agent_with_investigation_tools -v -s

# Human approval gate test
python -m pytest backend/tests/test_strands_integration.py::test_human_gate_pauses_execution -v -s
```

---

## How Human Approval Works

1. The `Orchestrator` runs the agent loop via `asyncio`
2. When a plan step has `requires_approval=True`, the loop calls `_human_gate()`
3. `_human_gate()` persists an approval record to the database with `status=pending`
4. It broadcasts `DECISION_REQUIRED` event over WebSocket to the frontend
5. The frontend renders an approval card with details and Approve/Reject buttons
6. The frontend POSTs to `/api/decisions/{id}/approve` or `/reject`
7. The API calls `orchestrator.resolve_approval(id, "approve")`
8. This sets an `asyncio.Event`, which unblocks the waiting coroutine
9. The agent workflow **resumes from where it stopped**

This is deterministic — no LLM is involved in the pause/resume decision.

---

## How to Trigger Replanning

The demo scenario automatically triggers a supplier delay:

```bash
# After starting a case and the initial purchase order is created,
# the simulation engine fires after ~15 seconds:
# - Marks the order as "delayed"
# - Broadcasts PLAN_INVALIDATED to the frontend
# - The Orchestrator detects this in _check_replan_triggers()
# - Calls _run_replanner() — real PlannerAgent creates new plan via Strands
```

To trigger manually:
```bash
curl -X POST http://localhost:8000/api/cases/{case_id}/simulate/delay
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/outcomes` | Create a new outcome case |
| GET | `/api/cases` | List all cases |
| GET | `/api/cases/{id}` | Get case detail with plan and events |
| POST | `/api/cases/{id}/start` | Start the Strands agent |
| GET | `/api/cases/{id}/events` | SSE stream of real-time events |
| GET | `/api/decisions` | List pending approvals |
| POST | `/api/decisions/{id}/approve` | Approve an action |
| POST | `/api/decisions/{id}/reject` | Reject an action |
| GET | `/api/inventory` | Inventory status |
| GET | `/api/suppliers` | Supplier list |
| WebSocket | `/ws` | Real-time event stream |

---

## Project Structure

```
RESOLVE-OS/
├── backend/
│   ├── app/
│   │   ├── agent/
│   │   │   ├── orchestrator.py          ← Main Strands workflow controller
│   │   │   ├── specialized_agents.py    ← PlannerAgent, InvestigatorAgent, etc.
│   │   │   ├── model_factory.py         ← Bedrock / LiteLLM model selection
│   │   │   ├── strands_compat.py        ← Real strands.tool import
│   │   │   ├── memory.py                ← Business policy engine (deterministic)
│   │   │   ├── outcome_contract.py      ← Outcome contract parser
│   │   │   ├── planner.py               ← Template plan fallback
│   │   │   └── tools/
│   │   │       ├── investigation.py     ← @tool: get_inventory, get_supplier, ...
│   │   │       ├── search.py            ← @tool: search_alternative_suppliers, ...
│   │   │       ├── action.py            ← @tool: create_purchase_order, send_email, ...
│   │   │       └── verification.py      ← @tool: verify_order, check_inventory_levels, ...
│   │   ├── api/
│   │   │   ├── cases.py                 ← Case CRUD endpoints
│   │   │   └── actions.py               ← Approval/rejection endpoints
│   │   ├── services/
│   │   │   ├── case_service.py
│   │   │   ├── events.py                ← WebSocket event bus
│   │   │   └── simulation.py            ← Demo event injector
│   │   ├── models/
│   │   │   ├── schemas.py               ← Pydantic models
│   │   │   └── database.py              ← SQLite (local) / DynamoDB (production)
│   │   └── main.py                      ← FastAPI app
│   ├── tests/
│   │   └── test_strands_integration.py  ← Strands agent tests (REQUIRED)
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/                         ← Next.js routes
│       └── components/                  ← React components
├── .env.example
├── pyproject.toml
└── README.md
```

---

## AWS Services in Use................

| Service | Purpose | Why it's needed |
|---------|---------|-----------------|
| **Strands Agents** | Agent orchestration framework | Powers autonomous multi-agent reasoning |
| **Amazon Bedrock** | Foundation model (Nova Lite/Pro, Claude) | LLM intelligence for planning/verification |
| **DynamoDB** | Business state persistence | WAITING_FOR_APPROVAL survives restarts |
| **S3** | Documents, invoices, attachments | Invoice upload for Document Agent |
| **EventBridge** | Scheduled monitoring | Check delivery status on schedule |
| **Lambda** | Event-driven processing | Process EventBridge monitoring events |
| **SES** | Supplier/customer email | Production email delivery |

---

## License

Built for the AWS Strands Agents Hackathon.
