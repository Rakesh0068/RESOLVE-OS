"""Verification Tools — confirm actions succeeded and monitor outcomes."""
import random
from datetime import datetime
from backend.app.agent.strands_compat import tool
from backend.app.models.database import query, get_connection


@tool
def verify_order(order_id: str = "") -> str:
    """Verify if a purchase order was confirmed and is being processed.
    If order_id is empty, checks the most recent order in the system."""
    if order_id:
        rows = query("SELECT * FROM purchase_orders WHERE id = ?", (order_id,))
    else:
        rows = query("SELECT * FROM purchase_orders ORDER BY order_date DESC LIMIT 1")
    if not rows:
        return "[X] No purchase orders found in system. The order may not have been created."

    r = rows[0]
    status_emoji = {
        "pending": "[~]",
        "confirmed": "[+]",
        "shipped": "🔵",
        "delivered": "[OK]",
        "delayed": "[!]",
        "cancelled": "[X]",
    }.get(r["status"], "[?]")

    return (
        f"{status_emoji} Order Verification: {r['id']}\n"
        f"   Supplier: {r['supplier_name']}\n"
        f"   Product: {r['product_name']} x{r['quantity']}\n"
        f"   Total: Rs.{r['total_cost']:,.0f}\n"
        f"   Status: {r['status'].upper()}\n"
        f"   Ordered: {r['order_date']}\n"
        f"   Expected: {r['expected_delivery']}\n"
        + (f"   Actual: {r['actual_delivery']}" if r['actual_delivery'] else "   Actual: Pending")
    )


@tool
def check_delivery_status(order_id: str) -> str:
    """Check the current delivery status of an order.
    Simulates checking with the supplier/logistics system."""
    rows = query("SELECT * FROM purchase_orders WHERE id = ?", (order_id,))
    if not rows:
        return f"[X] Order {order_id} not found."

    r = rows[0]

    # Simulate delivery status updates
    # In a real system this would check with logistics APIs
    possible_statuses = ["confirmed", "shipped", "in_transit", "out_for_delivery", "delivered"]
    current_status = r["status"]

    if current_status in ("pending", "confirmed"):
        # Simulate some progression
        sim_status = random.choice(["confirmed", "shipped"])
    elif current_status == "shipped":
        sim_status = random.choice(["shipped", "in_transit", "delivered"])
    elif current_status == "delayed":
        sim_status = "delayed"
    else:
        sim_status = current_status

    return (
        f"[BOX] Delivery Status: {r['id']}\n"
        f"   Order: {r['quantity']}x {r['product_name']}\n"
        f"   Supplier: {r['supplier_name']}\n"
        f"   Current Status: {sim_status.upper()}\n"
        f"   Expected Delivery: {r['expected_delivery']}\n"
        f"   Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    )


@tool
def check_inventory_levels(product_id: str = None) -> str:
    """Verify current inventory levels after actions have been taken.
    Compares against minimum thresholds to confirm stock safety."""
    if product_id:
        rows = query("SELECT * FROM products WHERE id = ?", (product_id,))
    else:
        rows = query("SELECT * FROM products ORDER BY category")

    if not rows:
        return "No inventory data found."

    result = ["[#] Inventory Verification Report:\n"]
    critical = []
    safe = []

    for r in rows:
        days_left = r["current_stock"] / r["daily_consumption"] if r["daily_consumption"] > 0 else 999
        stock_ratio = r["current_stock"] / r["minimum_stock"] if r["minimum_stock"] > 0 else 1

        if r["current_stock"] <= 0:
            status = "[!] OUT OF STOCK"
            critical.append(r)
        elif stock_ratio < 1:
            status = "[!] BELOW MINIMUM"
            critical.append(r)
        elif days_left < 3:
            status = "[~] LOW (days left)"
            critical.append(r)
        else:
            status = "[+] OK"
            safe.append(r)

        result.append(
            f"  {status} {r['name']}: {r['current_stock']} units "
            f"(min: {r['minimum_stock']}, {days_left:.1f} days supply)"
        )

    if critical:
        result.append(f"\n[!] {len(critical)} product(s) need attention!")
    else:
        result.append(f"\n[OK] All {len(safe)} products are at safe levels.")

    return "\n".join(result)
