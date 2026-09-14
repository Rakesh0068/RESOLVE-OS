"use client";

import { PURCHASE_ORDERS } from "@/data/demo";
import { Card, Badge } from "@/components/ui";

export default function OrdersPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Purchase orders and delivery tracking</p>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">Order</th>
              <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">Product</th>
              <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">Supplier</th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">Qty</th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">Cost</th>
              <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">ETA</th>
              <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {PURCHASE_ORDERS.map(o => (
              <tr key={o.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                <td className="px-5 py-4 font-mono text-sm">{o.id}</td>
                <td className="px-5 py-4 text-sm">{o.productName}</td>
                <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">{o.supplierName}</td>
                <td className="text-right px-5 py-4 font-mono text-sm">{o.quantity}</td>
                <td className="text-right px-5 py-4 font-mono text-sm">Rs.{o.totalCost.toLocaleString()}</td>
                <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">{o.expectedDelivery}</td>
                <td className="text-center px-5 py-4">
                  <Badge variant={o.status === "delivered" ? "green" : o.status === "delayed" ? "red" : o.status === "shipped" ? "blue" : "amber"}>
                    {o.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
