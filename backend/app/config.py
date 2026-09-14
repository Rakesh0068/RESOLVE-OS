"""ResolveOS Configuration"""
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "resolveos.db"

# Server
HOST = os.getenv("RESOLVEOS_HOST", "0.0.0.0")
PORT = int(os.getenv("RESOLVEOS_PORT", "8000"))

# Agent settings
MAX_REPLANS = 3
MAX_AUTONOMOUS_SPEND = 10000.0  # Rs.10,000
MAX_AUTONOMOUS_ACTIONS = 15
DEFAULT_RISK_THRESHOLD = 0.7  # 70% - escalate above this

# Business policies
BUSINESS_POLICIES = {
    "max_autonomous_purchase": 10000.0,
    "preferred_suppliers": [
        "Metro Wholesale",
        "Chai Point Supplies",
        "PackRight Industries",
        "GreenLeaf Traders",
    ],
    "never_change_supplier_without_approval": True,
    "max_auto_refund": 5000.0,
    "preferred_communication": "email",
    "notify_owner_when": [
        "approval_required",
        "risk_above_70",
        "failure_occurs",
    ],
}

# CORS
CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

# Simulation
SIMULATION_ENABLED = True
SIMULATION_RESPONSE_DELAY = 1.0  # seconds
