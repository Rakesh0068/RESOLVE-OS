"use client";

import { PRODUCTS, calculateInventoryRisk } from "@/data/demo";
import { Card, Badge, Progress } from "@/components/ui";

export default function InventoryPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Current stock levels and risk projections</p>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">Product</th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">Stock</th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">Min</th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">Daily</th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">Days Left</th>
              <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">Risk</th>
              <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map(p => {
              const risk = calculateInventoryRisk(p);
              const daysLeft = Math.round(p.currentStock / p.dailyConsumption);
              const status = p.currentStock <= 0 ? "OUT_OF_STOCK" : p.currentStock < p.minStock ? "LOW" : "OK";
              return (
                <tr key={p.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{p.category}</div>
                  </td>
                  <td className="text-right px-5 py-4 font-mono text-sm">{p.currentStock}</td>
                  <td className="text-right px-5 py-4 font-mono text-sm text-[var(--text-tertiary)]">{p.minStock}</td>
                  <td className="text-right px-5 py-4 font-mono text-sm text-[var(--text-tertiary)]">{p.dailyConsumption}</td>
                  <td className="text-right px-5 py-4 font-mono text-sm">{daysLeft}d</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Progress value={risk} color={risk > 70 ? "red" : risk > 40 ? "amber" : "green"} size="sm" />
                      <span className="text-xs font-mono w-8 text-right">{Math.round(risk)}%</span>
                    </div>
                  </td>
                  <td className="text-center px-5 py-4">
                    <Badge variant={status === "OK" ? "green" : status === "LOW" ? "amber" : "red"}>
                      {status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
