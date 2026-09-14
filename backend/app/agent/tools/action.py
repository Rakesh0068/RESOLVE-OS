"""Action Tools — execute business operations."""
import uuid
from datetime import datetime, timedelta
from backend.app.agent.strands_compat import tool
from backend.app.models.database import get_connection, query


@tool
def create_purchase_order(supplier_id: str, product_id: str, quantity: int, case_id: str = "") -> str:
    """Create a new purchase order. Returns the created order details."""
    # Look up supplier and product info
    suppliers = query("SELECT * FROM suppliers WHERE id = ?", (supplier_id,))
    products = query("SELECT * FROM products WHERE id = ?", (product_id,))
    sp_rows = query(
        "SELECT * FROM supplier_products WHERE supplier_id = ? AND product_id = ?",
        (supplier_id, product_id)
    )

    if not suppliers:
        return f"ERROR: Supplier {supplier_id} not found."
    if not products:
        return f"ERROR: Product {product_id} not found."
    if not sp_rows:
        return f"ERROR: Supplier {supplier_id} does not supply product {product_id}."

    supplier = suppliers[0]
    product = products[0]
    sp = sp_rows[0]

    total_cost = sp["price_per_unit"] * quantity
    expected_delivery = (datetime.now() + timedelta(days=sp["delivery_days"])).strftime("%Y-%m-%d")
    po_id = f"PO-{uuid.uuid4().hex[:8].upper()}"

    conn = get_connection()
    conn.execute(
        """INSERT INTO purchase_orders 
           (id, supplier_id, supplier_name, product_id, product_name, quantity, 
            total_cost, order_date, expected_delivery, status, case_id)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
        (po_id, supplier_id, supplier["name"], product_id, product["name"],
         quantity, total_cost, datetime.now().isoformat(), expected_delivery, "confirmed", case_id or None)
    )
    conn.commit()
    conn.close()

    return (
        f"[OK] Purchase Order Created: {po_id}\n"
        f"   Supplier: {supplier['name']}\n"
        f"   Product: {product['name']}\n"
        f"   Quantity: {quantity} {product['unit']}\n"
        f"   Total Cost: Rs.{total_cost:,.0f}\n"
        f"   Expected Delivery: {expected_delivery}\n"
        f"   Status: Confirmed"
    )


@tool
def send_email(to: str, subject: str, body: str) -> str:
    """Simulate sending an email to a supplier or customer.
    In production this would use an actual email service."""
    email_id = f"EMAIL-{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return (
        f"[EMAIL] Email Sent: {email_id}\n"
        f"   To: {to}\n"
        f"   Subject: {subject}\n"
        f"   Time: {timestamp}\n"
        f"   Status: Delivered"
    )


@tool
def update_case_status(case_id: str, status: str, risk_level: float = None) -> str:
    """Update the status and optionally the risk level of a case."""
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
    return f"[OK] Case {case_id} updated: status={status}" + (f", risk={risk_level:.0%}" if risk_level else "")


@tool
def log_activity(case_id: str, message: str, step_type: str = "act") -> str:
    """Log an activity event for the case activity feed."""
    conn = get_connection()
    conn.execute(
        "INSERT INTO activity_log (case_id, timestamp, message, step_type) VALUES (?,?,?,?)",
        (case_id, datetime.now().isoformat(), message, step_type)
    )
    conn.commit()
    conn.close()
    return f"[PLAN] Logged: {message}"
