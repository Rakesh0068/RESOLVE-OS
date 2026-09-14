"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllCases } from "@/lib/store";
import type { Case } from "@/data/demo";
import { Card, Badge, Tabs, EmptyState } from "@/components/ui";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "decision_required", label: "Decision required" },
  { key: "monitoring", label: "Monitoring" },
  { key: "resolved", label: "Resolved" },
];

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => { setCases(getAllCases()); }, []);

  const filtered = cases.filter(c => {
    if (filter === "all") return true;
    if (filter === "active") return c.status !== "resolved";
    return c.status === filter;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cases</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">All operational cases managed by ResolveOS</p>
      </div>

      <Tabs
        tabs={STATUS_FILTERS.map(f => ({
          key: f.key,
          label: f.label,
          count: f.key === "all" ? cases.length : cases.filter(c => f.key === "active" ? c.status !== "resolved" : c.status === f.key).length,
        }))}
        active={filter}
        onChange={setFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState icon="◎" title="No cases" description="No cases match the current filter." />
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <Link key={c.id} href={`/app/cases/${c.id}`}>
              <Card className="p-4 hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      c.status === "resolved" ? "bg-[var(--green-500)]" :
                      c.status === "decision_required" ? "bg-[var(--red-500)]" :
                      c.status === "monitoring" ? "bg-[var(--amber-500)]" :
                      "bg-[var(--blue-500)]"
                    }`} />
                    <div>
                      <h3 className="font-medium text-sm">{c.title}</h3>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{c.id} · {c.goal.substring(0, 60)}...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={
                      c.status === "resolved" ? "green" :
                      c.status === "decision_required" ? "red" :
                      c.status === "monitoring" ? "amber" :
                      "blue"
                    }>
                      {c.status.replace(/_/g, " ")}
                    </Badge>
                    {c.riskScore > 0 && (
                      <span className={`font-mono text-sm font-bold ${c.riskScore > 70 ? "text-[var(--red-400)]" : "text-[var(--text-tertiary)]"}`}>
                        {c.riskScore}%
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
