"""Search Tools — find and compare supplier alternatives."""
from backend.app.agent.strands_compat import tool
from backend.app.models.database import query


@tool
def search_alternative_suppliers(product_id: str, max_delivery_days: int = 7) -> str:
    """Find alternative suppliers for a product, filtering by max delivery time.
    Returns suppliers sorted by delivery speed, including price comparison."""
    rows = query(
        """SELECT sp.*, s.name as supplier_name, s.reliability_score, s.contact_email
           FROM supplier_products sp
           JOIN suppliers s ON sp.supplier_id = s.id
           WHERE sp.product_id = ? AND sp.delivery_days <= ?
           ORDER BY sp.delivery_days ASC, sp.price_per_unit ASC""",
        (product_id, max_delivery_days)
    )
    if not rows:
        return f"No suppliers found for product {product_id} with delivery under {max_delivery_days} days."

    product_rows = query("SELECT name FROM products WHERE id = ?", (product_id,))
    product_name = product_rows[0]["name"] if product_rows else product_id

    result = [f"Suppliers for {product_name} (delivery ≤ {max_delivery_days} days):"]
    for r in rows:
        result.append(
            f"  • {r['supplier_name']} [{r['supplier_id']}]: "
            f"Rs.{r['price_per_unit']:.0f}/unit, "
            f"{r['delivery_days']} days delivery, "
            f"reliability={r['reliability_score']:.0%}"
        )
    return "\n".join(result)


@tool
def compare_supplier_options(supplier_ids: str, product_id: str, quantity: int) -> str:
    """Compare pricing and delivery for multiple suppliers for a given product and quantity.
    supplier_ids should be comma-separated, e.g. 'SUP-001,SUP-002,SUP-003'."""
    ids = [s.strip() for s in supplier_ids.split(",")]
    placeholders = ",".join("?" * len(ids))

    product_rows = query("SELECT name, minimum_stock, current_stock FROM products WHERE id = ?", (product_id,))
    product_name = product_rows[0]["name"] if product_rows else product_id
    current_stock = product_rows[0]["current_stock"] if product_rows else 0
    min_stock = product_rows[0]["minimum_stock"] if product_rows else 0

    rows = query(
        f"""SELECT sp.*, s.name as supplier_name, s.reliability_score, s.contact_email
            FROM supplier_products sp
            JOIN suppliers s ON sp.supplier_id = s.id
            WHERE sp.product_id = ? AND sp.supplier_id IN ({placeholders})""",
        (product_id, *ids)
    )

    if not rows:
        return "No matching supplier options found."

    result = [f"Comparison for {quantity}x {product_name} (current stock: {current_stock}, min: {min_stock}):\n"]
    for r in rows:
        total_cost = r["price_per_unit"] * quantity
        result.append(
            f"[BOX] {r['supplier_name']} [{r['supplier_id']}]\n"
            f"   Unit price: Rs.{r['price_per_unit']:.0f}\n"
            f"   Total cost: Rs.{total_cost:,.0f}\n"
            f"   Delivery: {r['delivery_days']} days\n"
            f"   Reliability: {r['reliability_score']:.0%}\n"
        )

    # Add recommendation
    if rows:
        fastest = min(rows, key=lambda x: x["delivery_days"])
        cheapest = min(rows, key=lambda x: x["price_per_unit"])
        best_value = min(rows, key=lambda x: x["price_per_unit"] * (1.1 - x["reliability_score"]))

        result.append("─── Recommendations ───")
        if fastest["supplier_id"] != cheapest["supplier_id"]:
            result.append(f"⚡ Fastest: {fastest['supplier_name']} ({fastest['delivery_days']} days)")
            result.append(f"[MONEY] Cheapest: {cheapest['supplier_name']} (Rs.{cheapest['price_per_unit']:.0f}/unit)")
        result.append(f"⭐ Best value: {best_value['supplier_name']} (balanced cost + reliability)")

    return "\n".join(result)
