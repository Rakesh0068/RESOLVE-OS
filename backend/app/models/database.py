"""SQLite Database Setup"""
import sqlite3
import json
from pathlib import Path
from backend.app.config import DB_PATH


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create all tables."""
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT DEFAULT '',
            unit_price REAL NOT NULL,
            minimum_stock INTEGER NOT NULL,
            current_stock INTEGER NOT NULL,
            daily_consumption REAL NOT NULL,
            unit TEXT DEFAULT 'units'
        );

        CREATE TABLE IF NOT EXISTS suppliers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            contact_email TEXT DEFAULT '',
            contact_phone TEXT DEFAULT '',
            reliability_score REAL DEFAULT 0.8,
            average_delivery_days INTEGER DEFAULT 3,
            notes TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS supplier_products (
            supplier_id TEXT REFERENCES suppliers(id),
            product_id TEXT REFERENCES products(id),
            price_per_unit REAL NOT NULL,
            delivery_days INTEGER NOT NULL,
            min_order_quantity INTEGER DEFAULT 1,
            PRIMARY KEY (supplier_id, product_id)
        );

        CREATE TABLE IF NOT EXISTS purchase_orders (
            id TEXT PRIMARY KEY,
            supplier_id TEXT REFERENCES suppliers(id),
            supplier_name TEXT DEFAULT '',
            product_id TEXT REFERENCES products(id),
            product_name TEXT DEFAULT '',
            quantity INTEGER NOT NULL,
            total_cost REAL NOT NULL,
            order_date TEXT NOT NULL,
            expected_delivery TEXT NOT NULL,
            actual_delivery TEXT,
            status TEXT DEFAULT 'pending',
            case_id TEXT
        );

        CREATE TABLE IF NOT EXISTS cases (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            goal TEXT NOT NULL,
            status TEXT DEFAULT 'open',
            risk_level REAL DEFAULT 0.0,
            outcome_contract TEXT,
            current_plan TEXT,
            plan_history TEXT,
            actions_taken TEXT,
            replan_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            resolved_at TEXT
        );

        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id TEXT REFERENCES cases(id),
            timestamp TEXT NOT NULL,
            message TEXT NOT NULL,
            step_type TEXT NOT NULL,
            details TEXT
        );

        CREATE TABLE IF NOT EXISTS pending_approvals (
            id TEXT PRIMARY KEY,
            case_id TEXT REFERENCES cases(id),
            action_type TEXT NOT NULL,
            action_details TEXT NOT NULL,
            reason TEXT NOT NULL,
            created_at TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            resolved_at TEXT
        );
    """)
    conn.commit()
    conn.close()


# ── CRUD Helpers ───────────────────────────────────────

def insert_product(p: dict):
    conn = get_connection()
    conn.execute(
        "INSERT OR REPLACE INTO products VALUES (?,?,?,?,?,?,?,?)",
        (p["id"], p["name"], p.get("category", ""), p["unit_price"],
         p["minimum_stock"], p["current_stock"], p["daily_consumption"], p.get("unit", "units"))
    )
    conn.commit()
    conn.close()


def insert_supplier(s: dict):
    conn = get_connection()
    conn.execute(
        "INSERT OR REPLACE INTO suppliers VALUES (?,?,?,?,?,?,?)",
        (s["id"], s["name"], s.get("contact_email", ""), s.get("contact_phone", ""),
         s.get("reliability_score", 0.8), s.get("average_delivery_days", 3), s.get("notes", ""))
    )
    conn.commit()
    conn.close()


def insert_supplier_product(sp: dict):
    conn = get_connection()
    conn.execute(
        "INSERT OR REPLACE INTO supplier_products VALUES (?,?,?,?,?)",
        (sp["supplier_id"], sp["product_id"], sp["price_per_unit"],
         sp["delivery_days"], sp.get("min_order_quantity", 1))
    )
    conn.commit()
    conn.close()


def query(sql: str, params: tuple = ()) -> list[dict]:
    conn = get_connection()
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def execute(sql: str, params: tuple = ()):
    conn = get_connection()
    conn.execute(sql, params)
    conn.commit()
    conn.close()
