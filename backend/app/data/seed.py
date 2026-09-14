"""Seed database with realistic Indian café business data."""
from backend.app.models.database import (
    init_db, insert_product, insert_supplier, insert_supplier_product
)


PRODUCTS = [
    {"id": "PROD-001", "name": "Premium Tea Leaves (1kg)", "category": "Beverages",
     "unit_price": 420.0, "minimum_stock": 50, "current_stock": 120, "daily_consumption": 8.0, "unit": "packets"},
    {"id": "PROD-002", "name": "Organic Sugar (1kg)", "category": "Beverages",
     "unit_price": 180.0, "minimum_stock": 80, "current_stock": 95, "daily_consumption": 12.0, "unit": "packets"},
    {"id": "PROD-003", "name": "Paper Cups (100pk)", "category": "Packaging",
     "unit_price": 350.0, "minimum_stock": 30, "current_stock": 45, "daily_consumption": 5.0, "unit": "packs"},
    {"id": "PROD-004", "name": "Fresh Milk (1L)", "category": "Dairy",
     "unit_price": 65.0, "minimum_stock": 100, "current_stock": 140, "daily_consumption": 20.0, "unit": "litres"},
    {"id": "PROD-005", "name": "Coffee Powder (500g)", "category": "Beverages",
     "unit_price": 550.0, "minimum_stock": 25, "current_stock": 30, "daily_consumption": 4.0, "unit": "packets"},
    {"id": "PROD-006", "name": "Cleaning Solution (5L)", "category": "Supplies",
     "unit_price": 890.0, "minimum_stock": 10, "current_stock": 8, "daily_consumption": 0.5, "unit": "bottles"},
    {"id": "PROD-007", "name": "Napkins (500pk)", "category": "Packaging",
     "unit_price": 280.0, "minimum_stock": 40, "current_stock": 52, "daily_consumption": 6.0, "unit": "packs"},
    {"id": "PROD-008", "name": "Disposable Spoons (100pk)", "category": "Packaging",
     "unit_price": 150.0, "minimum_stock": 30, "current_stock": 28, "daily_consumption": 4.0, "unit": "packs"},
    {"id": "PROD-009", "name": "Masala Mix (500g)", "category": "Beverages",
     "unit_price": 320.0, "minimum_stock": 20, "current_stock": 35, "daily_consumption": 3.0, "unit": "packets"},
    {"id": "PROD-010", "name": "Biscuits (Assorted, 1kg)", "category": "Food",
     "unit_price": 240.0, "minimum_stock": 30, "current_stock": 42, "daily_consumption": 5.0, "unit": "packets"},
]

SUPPLIERS = [
    {"id": "SUP-001", "name": "Chai Point Supplies", "contact_email": "orders@chaipoint.in",
     "contact_phone": "+91-98765-43210", "reliability_score": 0.85, "average_delivery_days": 3,
     "notes": "Primary tea and beverage supplier"},
    {"id": "SUP-002", "name": "Metro Wholesale", "contact_email": "bulk@metrowholesale.in",
     "contact_phone": "+91-98765-43211", "reliability_score": 0.92, "average_delivery_days": 2,
     "notes": "General goods, reliable and fast"},
    {"id": "SUP-003", "name": "QuickMart Local", "contact_email": "rush@quickmart.in",
     "contact_phone": "+91-98765-43212", "reliability_score": 0.70, "average_delivery_days": 1,
     "notes": "Emergency supplies, same-day available, premium pricing"},
    {"id": "SUP-004", "name": "GreenLeaf Traders", "contact_email": "info@greenleaf.in",
     "contact_phone": "+91-98765-43213", "reliability_score": 0.88, "average_delivery_days": 5,
     "notes": "Organic products, slower but quality"},
    {"id": "SUP-005", "name": "PackRight Industries", "contact_email": "sales@packright.in",
     "contact_phone": "+91-98765-43214", "reliability_score": 0.95, "average_delivery_days": 4,
     "notes": "Packaging materials specialist"},
]

# supplier_id, product_id, price_per_unit, delivery_days
SUPPLIER_PRODUCTS = [
    # Chai Point - tea, coffee, masala
    ("SUP-001", "PROD-001", 420.0, 3),
    ("SUP-001", "PROD-005", 550.0, 3),
    ("SUP-001", "PROD-009", 320.0, 3),
    # Metro Wholesale - sugar, milk, biscuits, napkins, spoons
    ("SUP-002", "PROD-002", 180.0, 2),
    ("SUP-002", "PROD-004", 65.0, 2),
    ("SUP-002", "PROD-010", 240.0, 2),
    ("SUP-002", "PROD-007", 280.0, 2),
    ("SUP-002", "PROD-008", 150.0, 2),
    # QuickMart Local - emergency everything (premium pricing)
    ("SUP-003", "PROD-001", 510.0, 1),
    ("SUP-003", "PROD-002", 220.0, 1),
    ("SUP-003", "PROD-003", 420.0, 1),
    ("SUP-003", "PROD-004", 78.0, 1),
    ("SUP-003", "PROD-005", 660.0, 1),
    ("SUP-003", "PROD-007", 340.0, 1),
    # GreenLeaf - organic tea, sugar
    ("SUP-004", "PROD-001", 480.0, 5),
    ("SUP-004", "PROD-002", 210.0, 5),
    ("SUP-004", "PROD-009", 380.0, 5),
    # PackRight - packaging
    ("SUP-005", "PROD-003", 350.0, 4),
    ("SUP-005", "PROD-007", 280.0, 4),
    ("SUP-005", "PROD-008", 150.0, 4),
]


def seed_database():
    """Initialize and seed the database."""
    init_db()

    for product in PRODUCTS:
        insert_product(product)

    for supplier in SUPPLIERS:
        insert_supplier(supplier)

    for sp in SUPPLIER_PRODUCTS:
        insert_supplier_product({
            "supplier_id": sp[0],
            "product_id": sp[1],
            "price_per_unit": sp[2],
            "delivery_days": sp[3],
        })

    print(f"[OK] Seeded {len(PRODUCTS)} products")
    print(f"[OK] Seeded {len(SUPPLIERS)} suppliers")
    print(f"[OK] Seeded {len(SUPPLIER_PRODUCTS)} supplier-product links")


if __name__ == "__main__":
    seed_database()
