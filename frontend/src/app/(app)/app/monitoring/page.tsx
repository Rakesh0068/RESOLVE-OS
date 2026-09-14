"use client";

import { getAllCases } from "@/lib/store";
import { Card, Badge, EmptyState } from "@/components/ui";
import Link from "next/link";

export default function MonitoringPage() {
  const monitoringCases = getAllCases().filter(c => c.status === "monitoring");

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Monitoring</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Active cases being monitored by ResolveOS</p>
      </div>
      {monitoringCases.length === 0 ? (
        <EmptyState icon="◔" title="No active monitoring" description="No cases are currently being monitored." />
      ) : (
        <div className="space-y-3">
          {monitoringCases.map(c => (
            <Link key={c.id} href={`/app/cases/${c.id}`}>
              <Card className="p-5 hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{c.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{c.id} · Next check: 6:00 PM</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="amber" pulse>Monitoring</Badge>
                    <span className="font-mono text-sm font-bold text-[var(--amber-400)]">{c.riskScore}%</span>
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
