"use client";

import { SUPPLIERS } from "@/data/demo";
import { Card, Badge } from "@/components/ui";

export default function SuppliersPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Supplier directory and reliability tracking</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SUPPLIERS.map(s => (
          <Card key={s.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{s.name}</h3>
                <p className="text-xs text-[var(--text-muted)]">{s.contact}</p>
              </div>
              <Badge variant={s.reliability > 0.9 ? "green" : s.reliability > 0.8 ? "amber" : "red"}>
                {Math.round(s.reliability * 100)}% reliable
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
              <span>Avg delivery: {s.avgDeliveryDays} days</span>
              <span>{s.products.length} products</span>
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
              <div className="text-xs text-[var(--text-muted)] mb-2">Products supplied</div>
              <div className="flex flex-wrap gap-2">
                {s.products.map(p => (
                  <span key={p.productId} className="text-xs bg-[var(--bg-tertiary)] px-2 py-1 rounded">
                    Rs.{p.price}/unit · {p.deliveryDays}d
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
