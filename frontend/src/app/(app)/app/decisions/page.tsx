"use client";

import { useEffect, useState } from "react";
import { getDecisions, approveDecision } from "@/lib/store";
import { Card, Badge, Button, Tabs, EmptyState, showToast } from "@/components/ui";
import type { CaseDecision } from "@/data/demo";

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<CaseDecision[]>([]);
  const [filter, setFilter] = useState("pending");

  useEffect(() => { setDecisions(getDecisions()); }, []);

  const filtered = decisions.filter(d => filter === "all" || d.status === filter);

  const handleApprove = async (id: string) => {
    await approveDecision(id);
    setDecisions(getDecisions());
    showToast("Approved");
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Decisions</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">ResolveOS needs your decision on these actions</p>
      </div>

      <Tabs
        tabs={[
          { key: "pending", label: "Needs attention", count: decisions.filter(d => d.status === "pending").length },
          { key: "approved", label: "Approved", count: decisions.filter(d => d.status === "approved").length },
          { key: "rejected", label: "Rejected", count: decisions.filter(d => d.status === "rejected").length },
          { key: "all", label: "All", count: decisions.length },
        ]}
        active={filter}
        onChange={setFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState icon="⬡" title="No decisions" description="No decisions match the current filter." />
      ) : (
        <div className="space-y-3">
          {filtered.map(d => (
            <Card key={d.id} className={`p-5 ${d.status === "pending" ? "border-l-4 border-l-[var(--red-500)]" : ""}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={d.status === "approved" ? "green" : d.status === "rejected" ? "red" : "amber"}>
                      {d.status}
                    </Badge>
                    <span className="text-xs text-[var(--text-muted)]">{d.caseId}</span>
                  </div>
                  <h3 className="font-semibold">{d.description}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{d.reason}</p>
                  {d.cost && <div className="font-mono font-bold text-lg mt-2">Rs.{d.cost.toLocaleString()}</div>}
                </div>
                {d.status === "pending" && (
                  <Button variant="success" onClick={() => handleApprove(d.id)}>Approve</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
