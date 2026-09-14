"use client";

import { INVOICES } from "@/data/demo";
import { Card, Badge } from "@/components/ui";

export default function InvoicesPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invoices</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Invoice processing and discrepancy detection</p>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">Invoice</th>
              <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">Supplier</th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">Amount</th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">PO Amount</th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">Difference</th>
              <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {INVOICES.map(inv => (
              <tr key={inv.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                <td className="px-5 py-4 font-mono text-sm">{inv.id}</td>
                <td className="px-5 py-4 text-sm">{inv.supplierName}</td>
                <td className="text-right px-5 py-4 font-mono text-sm">Rs.{inv.amount.toLocaleString()}</td>
                <td className="text-right px-5 py-4 font-mono text-sm">Rs.{inv.poAmount.toLocaleString()}</td>
                <td className={`text-right px-5 py-4 font-mono text-sm font-bold ${inv.difference > 0 ? "text-[var(--red-400)]" : ""}`}>
                  {inv.difference > 0 ? `Rs.${inv.difference.toLocaleString()}` : "--"}
                </td>
                <td className="text-center px-5 py-4">
                  <Badge variant={inv.status === "matched" ? "green" : inv.status === "discrepancy" ? "red" : "amber"}>
                    {inv.status}
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
