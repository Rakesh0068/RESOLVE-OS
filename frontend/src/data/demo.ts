// ── Demo Data Engine ─────────────────────────────────────
// Deterministic business simulation for the demo flow.

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  minStock: number;
  currentStock: number;
  dailyConsumption: number;
  unit: string;
}

export interface Supplier {
  id: string;
  name: string;
  reliability: number;
  avgDeliveryDays: number;
  contact: string;
  products: { productId: string; price: number; deliveryDays: number }[];
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  orders: number;
  issues: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  quantity: number;
  totalCost: number;
  orderDate: string;
  expectedDelivery: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "delayed" | "cancelled";
}

export interface Invoice {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  poAmount: number;
  poReference: string;
  date: string;
  status: "pending" | "matched" | "discrepancy" | "resolved";
  difference: number;
}

// ── Products ────────────────────────────────────────────

export const PRODUCTS: Product[] = [
  { id: "PROD-001", name: "Premium Tea Leaves (1kg)", category: "Beverages", price: 420, minStock: 50, currentStock: 120, dailyConsumption: 8, unit: "packets" },
  { id: "PROD-002", name: "Organic Sugar (1kg)", category: "Beverages", price: 180, minStock: 80, currentStock: 95, dailyConsumption: 12, unit: "packets" },
  { id: "PROD-003", name: "Paper Cups (100pk)", category: "Packaging", price: 350, minStock: 30, currentStock: 45, dailyConsumption: 5, unit: "packs" },
  { id: "PROD-004", name: "Fresh Milk (1L)", category: "Dairy", price: 65, minStock: 100, currentStock: 140, dailyConsumption: 20, unit: "litres" },
  { id: "PROD-005", name: "Coffee Powder (500g)", category: "Beverages", price: 550, minStock: 25, currentStock: 30, dailyConsumption: 4, unit: "packets" },
  { id: "PROD-006", name: "Cleaning Solution (5L)", category: "Supplies", price: 890, minStock: 10, currentStock: 8, dailyConsumption: 0.5, unit: "bottles" },
  { id: "PROD-007", name: "Napkins (500pk)", category: "Packaging", price: 280, minStock: 40, currentStock: 52, dailyConsumption: 6, unit: "packs" },
  { id: "PROD-008", name: "Disposable Spoons (100pk)", category: "Packaging", price: 150, minStock: 30, currentStock: 28, dailyConsumption: 4, unit: "packs" },
];

// ── Suppliers ───────────────────────────────────────────

export const SUPPLIERS: Supplier[] = [
  {
    id: "SUP-001", name: "Chai Point Supplies", reliability: 0.85, avgDeliveryDays: 3, contact: "orders@chaipoint.in",
    products: [
      { productId: "PROD-001", price: 420, deliveryDays: 3 },
      { productId: "PROD-005", price: 550, deliveryDays: 3 },
    ],
  },
  {
    id: "SUP-002", name: "Metro Wholesale", reliability: 0.92, avgDeliveryDays: 2, contact: "bulk@metrowholesale.in",
    products: [
      { productId: "PROD-002", price: 180, deliveryDays: 2 },
      { productId: "PROD-004", price: 65, deliveryDays: 2 },
      { productId: "PROD-007", price: 280, deliveryDays: 2 },
      { productId: "PROD-008", price: 150, deliveryDays: 2 },
    ],
  },
  {
    id: "SUP-003", name: "QuickMart Local", reliability: 0.70, avgDeliveryDays: 1, contact: "rush@quickmart.in",
    products: [
      { productId: "PROD-001", price: 510, deliveryDays: 1 },
      { productId: "PROD-002", price: 220, deliveryDays: 1 },
      { productId: "PROD-003", price: 420, deliveryDays: 1 },
      { productId: "PROD-004", price: 78, deliveryDays: 1 },
      { productId: "PROD-005", price: 660, deliveryDays: 1 },
      { productId: "PROD-007", price: 340, deliveryDays: 1 },
    ],
  },
  {
    id: "SUP-004", name: "GreenLeaf Traders", reliability: 0.88, avgDeliveryDays: 5, contact: "info@greenleaf.in",
    products: [
      { productId: "PROD-001", price: 480, deliveryDays: 5 },
      { productId: "PROD-002", price: 210, deliveryDays: 5 },
    ],
  },
  {
    id: "SUP-005", name: "PackRight Industries", reliability: 0.95, avgDeliveryDays: 4, contact: "sales@packright.in",
    products: [
      { productId: "PROD-003", price: 350, deliveryDays: 4 },
      { productId: "PROD-007", price: 280, deliveryDays: 4 },
      { productId: "PROD-008", price: 150, deliveryDays: 4 },
    ],
  },
];

// ── Customers ───────────────────────────────────────────

export const CUSTOMERS: Customer[] = [
  { id: "CUST-001", name: "Acme Manufacturing", contact: "procurement@acme.in", orders: 12, issues: 1 },
  { id: "CUST-002", name: "Nova Systems", contact: "orders@novasys.in", orders: 8, issues: 0 },
  { id: "CUST-003", name: "Vertex Engineering", contact: "supply@vertex.in", orders: 15, issues: 2 },
  { id: "CUST-004", name: "Delta Automation", contact: "purchase@delta.in", orders: 6, issues: 0 },
];

// ── Purchase Orders ─────────────────────────────────────

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: "PO-1294", supplierId: "SUP-001", supplierName: "Chai Point Supplies", productId: "PROD-001", productName: "Premium Tea Leaves (1kg)", quantity: 50, totalCost: 21000, orderDate: "2026-09-10", expectedDelivery: "2026-09-15", status: "delayed" },
  { id: "PO-1295", supplierId: "SUP-002", supplierName: "Metro Wholesale", productId: "PROD-002", productName: "Organic Sugar (1kg)", quantity: 100, totalCost: 18000, orderDate: "2026-09-12", expectedDelivery: "2026-09-16", status: "confirmed" },
  { id: "PO-1296", supplierId: "SUP-005", supplierName: "PackRight Industries", productId: "PROD-003", productName: "Paper Cups (100pk)", quantity: 30, totalCost: 10500, orderDate: "2026-09-11", expectedDelivery: "2026-09-17", status: "shipped" },
];

// ── Invoices ────────────────────────────────────────────

export const INVOICES: Invoice[] = [
  { id: "INV-3821", supplierId: "SUP-001", supplierName: "Chai Point Supplies", amount: 84500, poAmount: 72500, poReference: "PO-1294", date: "2026-09-13", status: "discrepancy", difference: 12000 },
  { id: "INV-3822", supplierId: "SUP-002", supplierName: "Metro Wholesale", amount: 18000, poAmount: 18000, poReference: "PO-1295", date: "2026-09-12", status: "matched", difference: 0 },
  { id: "INV-3823", supplierId: "SUP-005", supplierName: "PackRight Industries", amount: 10500, poAmount: 10500, poReference: "PO-1296", date: "2026-09-11", status: "matched", difference: 0 },
];

// ── Risk Calculation ────────────────────────────────────

export function calculateInventoryRisk(product: Product): number {
  const daysUntilStockout = product.currentStock / product.dailyConsumption;
  const stockRatio = product.currentStock / product.minStock;
  if (stockRatio < 0.5) return Math.min(100, 90 + (0.5 - stockRatio) * 20);
  if (daysUntilStockout < 3) return Math.min(100, 70 + (3 - daysUntilStockout) * 10);
  if (stockRatio < 1) return Math.min(100, 40 + (1 - stockRatio) * 50);
  return Math.max(0, 20 - stockRatio * 5);
}

export function getSupplierAlternatives(productId: string) {
  return SUPPLIERS
    .flatMap(s => s.products.filter(p => p.productId === productId).map(p => ({
      supplierId: s.id,
      supplierName: s.name,
      price: p.price,
      deliveryDays: p.deliveryDays,
      reliability: s.reliability,
      contact: s.contact,
    })))
    .sort((a, b) => a.deliveryDays - b.deliveryDays);
}

// ── Types for cases ─────────────────────────────────────

export type CaseStatus =
  | "created" | "understanding" | "planning" | "investigating"
  | "decision_required" | "executing" | "monitoring"
  | "verifying" | "replanning" | "resolved" | "failed" | "escalated" | "blocked";

export interface CaseEvent {
  id: string;
  caseId: string;
  timestamp: string;
  type: string;
  message: string;
  details?: any;
}

export interface CasePlan {
  id: string;
  name: string;
  steps: { id: string; description: string; tool: string; status: string; result?: any; requiresApproval?: boolean }[];
}

export interface CaseDecision {
  id: string;
  caseId: string;
  actionType: string;
  description: string;
  cost?: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface Case {
  id: string;
  title: string;
  goal: string;
  status: CaseStatus;
  riskScore: number;
  riskFactors: { label: string; level: "low" | "medium" | "high" }[];
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  events: CaseEvent[];
  plans: CasePlan[];
  currentPlanIndex: number;
  decisions: CaseDecision[];
  replanCount: number;
  maxReplans: number;
  autonomyBudget: {
    maxSpend: number;
    spent: number;
    maxActions: number;
    actionsUsed: number;
    maxReplans: number;
    replansUsed: number;
  };
  resolution?: {
    initialRisk: number;
    finalRisk: number;
    cost: number;
    replans: number;
    humanInterventions: number;
    actions: string[];
  };
}
