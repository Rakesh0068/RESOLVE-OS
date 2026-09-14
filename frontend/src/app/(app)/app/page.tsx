"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllCases, getStats, createCase, runCase, getPendingDecisions, approveDecision } from "@/lib/store";
import { PRODUCTS, calculateInventoryRisk } from "@/data/demo";
import type { Case, CaseDecision } from "@/data/demo";
import { Button, Badge, Card, Progress, EmptyState, Input, showToast } from "@/components/ui";

export default function DashboardPage() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0, monitoring: 0, needsDecision: 0, failed: 0, escalated: 0 });
  const [decisions, setDecisions] = useState<CaseDecision[]>([]);
  const [goal, setGoal] = useState("");
  const [creating, setCreating] = useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);

  const refresh = useCallback(() => {
    setCases(getAllCases());
    setStats(getStats());
    setDecisions(getPendingDecisions());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const product = PRODUCTS[0];
  const healthScore = Math.round(100 - calculateInventoryRisk(product));

  const handleCreateOutcome = async () => {
    if (!goal.trim()) return;
    setCreating(true);
    const c = createCase(goal.trim());
    await runCase(c.id);
    setCreating(false);
    setGoal("");
    refresh();
    router.push(`/app/cases/${c.id}`);
  };

  const handleApprove = async (decisionId: string) => {
    await approveDecision(decisionId);
    refresh();
    showToast("Approved and executing");
  };

  const activeCases = cases.filter(c => c.status !== "resolved");
  const resolvedCases = cases.filter(c => c.status === "resolved");
  const allClear = stats.active === 0 && stats.needsDecision === 0;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Hero */}
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          {allClear ? "All clear." : "ResolveOS is working."}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {allClear
            ? "No action required from you right now. ResolveOS is handling the rest."
            : `Handling ${stats.active} operational issue${stats.active !== 1 ? "s" : ""} across your business.`}
        </p>
      </div>

      {/* System Status */}
      <Card className="p-6 animate-slide-up" style={{ animationDelay: "0.05s" }}>
        <div className="flex items-center gap-3 mb-6">
          <span className={`w-3 h-3 rounded-full ${allClear ? "bg-[var(--green-500)]" : "bg-[var(--amber-500)] animate-pulse-subtle"}`} />
          <span className="text-lg font-semibold">{allClear ? "OPERATIONAL" : "ACTIVE"}</span>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <div className="text-3xl font-bold text-[var(--green-400)]">{stats.resolved}</div>
            <div className="text-sm text-[var(--text-secondary)] mt-1">Resolved automatically</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--amber-400)]">{stats.monitoring}</div>
            <div className="text-sm text-[var(--text-secondary)] mt-1">Being monitored</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--red-400)]">{stats.needsDecision}</div>
            <div className="text-sm text-[var(--text-secondary)] mt-1">Decision required</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--text-secondary)]">Autonomy efficiency</span>
              <span className="font-mono font-medium">{stats.total > 0 ? `${Math.round((stats.resolved / Math.max(stats.total, 1)) * 100)}%` : "--"}</span>
            </div>
            <Progress value={stats.total > 0 ? (stats.resolved / Math.max(stats.total, 1)) * 100 : 0} color="green" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--text-secondary)]">Inventory health</span>
              <span className="font-mono font-medium">{healthScore}/100</span>
            </div>
            <Progress value={healthScore} color={healthScore > 70 ? "green" : healthScore > 40 ? "amber" : "red"} />
          </div>
        </div>
      </Card>

      {/* Attention Required */}
      {decisions.length > 0 && (
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--red-400)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--red-400)] animate-pulse-subtle" />
            Attention Required
          </h2>
          {decisions.map(d => (
            <Card key={d.id} className="p-5 border-l-4 border-l-[var(--red-500)]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-[var(--red-400)] font-semibold uppercase tracking-wider mb-1">Decision Required</div>
                  <h3 className="font-semibold text-lg mb-1">{d.description}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">{d.reason}</p>
                  <div className="flex items-center gap-4 text-sm">
                    {d.cost && <span className="font-mono font-bold text-lg">Rs.{d.cost.toLocaleString()}</span>}
                    <Badge variant="red" pulse>Requires approval</Badge>
                  </div>
                </div>
                <Button variant="success" onClick={() => handleApprove(d.id)}>Approve & Execute</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Outcome */}
      <Card className="p-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">Give ResolveOS an outcome</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreateOutcome()}
            placeholder="What outcome do you want to resolve?"
            className="flex-1 h-12 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--blue-500)] transition-colors"
            disabled={creating}
          />
          <Button onClick={handleCreateOutcome} loading={creating} size="lg">Resolve</Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            "The supplier says our tea leaves delivery will be late. Make sure we dont run out of stock.",
            "We received an invoice that doesnt match our purchase order. Resolve this.",
            "A customer is complaining about a delayed order. Handle this.",
          ].map((ex, i) => (
            <button key={i} onClick={() => setGoal(ex)}
              className="text-xs bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-[var(--border-subtle)]">
              {ex.substring(0, 40)}...
            </button>
          ))}
        </div>
      </Card>

      {/* Active Cases */}
      {activeCases.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Active Cases ({activeCases.length})</h2>
          <div className="space-y-2">
            {activeCases.map(c => (
              <Link key={c.id} href={`/app/cases/${c.id}`}>
                <Card className="p-4 hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusDot status={c.status} />
                      <div>
                        <h3 className="font-medium text-sm">{c.title}</h3>
                        <p className="text-xs text-[var(--text-tertiary)]">{c.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={c.status === "decision_required" ? "red" : c.status === "monitoring" ? "amber" : "blue"}>
                        {c.status.replace(/_/g, " ")}
                      </Badge>
                      {c.riskScore > 0 && (
                        <span className={`font-mono text-sm font-bold ${c.riskScore > 70 ? "text-[var(--red-400)]" : c.riskScore > 40 ? "text-[var(--amber-400)]" : "text-[var(--green-400)]"}`}>
                          {c.riskScore}%
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Resolved */}
      {resolvedCases.length > 0 && (
        <div className="space-y-3 opacity-60">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Resolved ({resolvedCases.length})</h2>
          <div className="space-y-2">
            {resolvedCases.map(c => (
              <Link key={c.id} href={`/app/cases/${c.id}`}>
                <Card className="p-4 hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-[var(--green-500)]" />
                      <div>
                        <h3 className="font-medium text-sm">{c.title}</h3>
                        <p className="text-xs text-[var(--text-tertiary)]">{c.id}</p>
                      </div>
                    </div>
                    <Badge variant="green">Resolved</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {cases.length === 0 && (
        <EmptyState
          icon="◉"
          title="No cases yet"
          description="Give ResolveOS an outcome to get started. It will investigate, plan, and act on your behalf."
          action={<Button onClick={() => document.querySelector<HTMLInputElement>("input[placeholder*='outcome']")?.focus()}>Give ResolveOS an outcome</Button>}
        />
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    created: "bg-[var(--text-muted)]",
    understanding: "bg-[var(--blue-500)]",
    planning: "bg-[var(--purple-500)]",
    investigating: "bg-[var(--blue-500)]",
    decision_required: "bg-[var(--red-500)] animate-pulse-subtle",
    executing: "bg-[var(--amber-500)]",
    monitoring: "bg-[var(--amber-500)] animate-pulse-subtle",
    replanning: "bg-[var(--amber-500)]",
    verifying: "bg-[var(--blue-500)]",
    resolved: "bg-[var(--green-500)]",
    failed: "bg-[var(--red-500)]",
    escalated: "bg-[var(--red-500)]",
  };
  return <span className={`w-2.5 h-2.5 rounded-full ${colors[status] || "bg-[var(--text-muted)]"}`} />;
}
