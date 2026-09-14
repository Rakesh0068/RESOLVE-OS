"use client";

import { useEffect, useState, useCallback } from "react";
import { listCases, getStats } from "@/lib/api";
import { Case, DashboardStats } from "@/types";
import GoalInput from "@/components/GoalInput";
import CaseCard from "@/components/CaseCard";

export default function Dashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_cases: 0,
    resolved: 0,
    monitoring: 0,
    needs_decision: 0,
    active: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [casesRes, statsRes] = await Promise.all([listCases(), getStats()]);
      setCases(casesRes.cases);
      setStats(statsRes);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const activeCases = cases.filter((c) => c.status !== "resolved");
  const resolvedCases = cases.filter((c) => c.status === "resolved");
  const decisionsNeeded = cases.filter((c) => c.status === "awaiting_approval");

  const allClear = stats.active === 0 && stats.needs_decision === 0;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Hero */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          {allClear ? "All clear." : "ResolveOS is working."}
        </h1>
        <p className="text-text-secondary text-base">
          {allClear
            ? "No action required from you right now."
            : `Handling ${stats.active} operational issue${stats.active !== 1 ? "s" : ""} across your business.`}
        </p>
      </div>

      {/* System Status Card */}
      <div className="bg-bg-secondary rounded-xl border border-bg-tertiary p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className={`w-3 h-3 rounded-full ${allClear ? "bg-accent-green" : "bg-accent-yellow animate-pulse-dot"}`} />
          <span className="text-lg font-semibold">
            {allClear ? "OPERATIONAL" : "ACTIVE"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <div className="text-3xl font-bold text-accent-green">{stats.resolved}</div>
            <div className="text-sm text-text-secondary mt-1">Resolved automatically</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent-yellow">{stats.monitoring}</div>
            <div className="text-sm text-text-secondary mt-1">Being monitored</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent-red">{stats.needs_decision}</div>
            <div className="text-sm text-text-secondary mt-1">Decision required</div>
          </div>
        </div>

        {/* Autonomy efficiency bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-secondary">Autonomy efficiency</span>
            <span className="font-mono font-medium">
              {stats.total_cases > 0
                ? `${Math.round((stats.resolved / Math.max(stats.total_cases, 1)) * 100)}%`
                : "--"}
            </span>
          </div>
          <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-green rounded-full transition-all duration-1000"
              style={{
                width: `${
                  stats.total_cases > 0
                    ? Math.round((stats.resolved / Math.max(stats.total_cases, 1)) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Attention Required */}
      {decisionsNeeded.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent-red flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse-dot" />
            Attention Required
          </h2>
          {decisionsNeeded.map((c) => (
            <CaseCard key={c.id} caseData={c} urgent />
          ))}
        </div>
      )}

      {/* Goal Input */}
      <GoalInput onCreated={loadData} />

      {/* Active Cases */}
      {activeCases.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-text-secondary">
            Active Cases ({activeCases.length})
          </h2>
          <div className="space-y-2">
            {activeCases.map((c) => (
              <CaseCard key={c.id} caseData={c} />
            ))}
          </div>
        </div>
      )}

      {/* Resolved */}
      {resolvedCases.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-text-secondary">
            Resolved ({resolvedCases.length})
          </h2>
          <div className="space-y-2 opacity-60">
            {resolvedCases.map((c) => (
              <CaseCard key={c.id} caseData={c} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {loading ? (
        <div className="text-center py-12 text-text-secondary">Loading...</div>
      ) : cases.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4 opacity-20">◉</div>
          <p className="text-text-secondary text-lg mb-2">No cases yet</p>
          <p className="text-text-secondary text-sm">Submit a goal above to get started.</p>
        </div>
      ) : null}
    </div>
  );
}
