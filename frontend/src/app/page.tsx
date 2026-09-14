"use client";

import { useEffect, useState, useCallback } from "react";
import { listCases, getStats } from "@/lib/api";
import { Case, DashboardStats } from "@/types";
import StatsBar from "@/components/StatsBar";
import CaseCard from "@/components/CaseCard";
import GoalInput from "@/components/GoalInput";

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
    const interval = setInterval(loadData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [loadData]);

  const activeCases = cases.filter((c) => c.status !== "resolved");
  const resolvedCases = cases.filter((c) => c.status === "resolved");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-bg-tertiary bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-blue rounded-lg flex items-center justify-center font-bold text-white text-sm">
              R
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">ResolveOS</h1>
              <p className="text-xs text-text-secondary">The Autonomous Operations Agent</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse-dot" />
            <span className="text-xs text-text-secondary">Active</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Goal Input */}
        <div className="mb-8">
          <GoalInput onCreated={loadData} />
        </div>

        {/* Active Cases */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            Active Cases
            <span className="text-sm text-text-secondary font-normal">({activeCases.length})</span>
          </h2>

          {loading ? (
            <div className="text-text-secondary text-sm py-8 text-center">Loading cases...</div>
          ) : activeCases.length === 0 ? (
            <div className="bg-bg-secondary rounded-lg p-8 text-center border border-bg-tertiary">
              <p className="text-text-secondary">No active cases. Submit a goal above to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCases.map((c) => (
                <CaseCard key={c.id} caseData={c} />
              ))}
            </div>
          )}
        </section>

        {/* Resolved Cases */}
        {resolvedCases.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Resolved
              <span className="text-sm text-text-secondary font-normal">({resolvedCases.length})</span>
            </h2>
            <div className="space-y-3 opacity-75">
              {resolvedCases.map((c) => (
                <CaseCard key={c.id} caseData={c} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
