"""Investigation Tools — retrieve business data for the agent."""
from backend.app.agent.strands_compat import tool
from backend.app.models.database import query


@tool
def get_inventory(product_id: str = None) -> str:
    """Get current inventory levels. Pass product_id to filter, or leave empty for all products."""
    if product_id:
        rows = query("SELECT * FROM products WHERE id = ?", (product_id,))
    else:
        rows = query("SELECT * FROM products ORDER BY category, name")
    if not rows:
        return "No inventory data found."
    result = []
    for r in rows:
        stock_status = "OK" if r["current_stock"] > r["minimum_stock"] else "LOW"
        if r["current_stock"] == 0:
            stock_status = "OUT_OF_STOCK"
        days_left = round(r["current_stock"] / r["daily_consumption"], 1) if r["daily_consumption"] > 0 else 999
        result.append(
            f"• {r['name']} [{r['id']}]: {r['current_stock']} {r['unit']} in stock "
            f"(min: {r['minimum_stock']}, usage: {r['daily_consumption']}/day, "
            f"~{days_left} days left) [{stock_status}]"
        )
    return "\n".join(result)


@tool
def get_purchase_order(order_id: str = None, case_id: str = None) -> str:
    """Get purchase order details. Filter by order_id or case_id, or leave empty for all recent orders."""
    if order_id:
        rows = query("SELECT * FROM purchase_orders WHERE id = ?", (order_id,))
    elif case_id:
        rows = query("SELECT * FROM purchase_orders WHERE case_id = ?", (case_id,))
    else:
        rows = query("SELECT * FROM purchase_orders ORDER BY order_date DESC LIMIT 20")
    if not rows:
        return "No purchase orders found."
    result = []
    for r in rows:
        result.append(
            f"• PO {r['id']}: {r['quantity']}x {r['product_name']} from {r['supplier_name']} "
            f"= Rs.{r['total_cost']:,.0f} | Status: {r['status']} | ETA: {r['expected_delivery']}"
        )
    return "\n".join(result)


@tool
def get_supplier(supplier_id: str = None) -> str:
    """Get supplier details. Filter by supplier_id or leave empty for all suppliers."""
    if supplier_id:
        rows = query("SELECT * FROM suppliers WHERE id = ?", (supplier_id,))
    else:
        rows = query("SELECT * FROM suppliers ORDER BY reliability_score DESC")
    if not rows:
        return "No suppliers found."
    result = []
    for r in rows:
        result.append(
            f"• {r['name']} [{r['id']}]: reliability={r['reliability_score']:.0%}, "
            f"avg delivery={r['average_delivery_days']} days, "
            f"contact={r['contact_email']}"
        )
    return "\n".join(result)


@tool
def get_supplier_history(supplier_id: str) -> str:
    """Get order history for a specific supplier to assess reliability."""
    rows = query(
        "SELECT * FROM purchase_orders WHERE supplier_id = ? ORDER BY order_date DESC LIMIT 10",
        (supplier_id,)
    )
    if not rows:
        return f"No order history found for supplier {supplier_id}."

    total = len(rows)
    delayed = sum(1 for r in rows if r["status"] in ("delayed", "cancelled"))
    on_time = sum(1 for r in rows if r["status"] in ("delivered", "confirmed"))
    reliability = (on_time / total * 100) if total > 0 else 0

    result = [f"Supplier {supplier_id} History ({total} recent orders):"]
    result.append(f"  On-time/delivered: {on_time} ({reliability:.0f}%)")
    result.append(f"  Delayed/cancelled: {delayed}")
    for r in rows[:5]:
        result.append(f"  • PO {r['id']}: {r['product_name']} x{r['quantity']} → {r['status']}")
    return "\n".join(result)


@tool
def get_product(product_id: str) -> str:
    """Get details for a specific product."""
    rows = query("SELECT * FROM products WHERE id = ?", (product_id,))
    if not rows:
        return f"Product {product_id} not found."
    r = rows[0]
    days_left = round(r["current_stock"] / r["daily_consumption"], 1) if r["daily_consumption"] > 0 else 999
    return (
        f"{r['name']} [{r['id']}]\n"
        f"  Category: {r['category']}\n"
        f"  Price: Rs.{r['unit_price']:.0f}/{r['unit']}\n"
        f"  Stock: {r['current_stock']}/{r['minimum_stock']} (min)\n"
        f"  Daily usage: {r['daily_consumption']}\n"
        f"  Days until stockout: {days_left}"
    )
