"use client";

import { getAllCases } from "@/lib/store";
import { Card, EmptyState } from "@/components/ui";

export default function ActivityPage() {
  const allEvents = getAllCases().flatMap(c => c.events).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Global event stream across all cases</p>
      </div>
      {allEvents.length === 0 ? (
        <EmptyState icon="≡" title="No activity" description="No events have been recorded yet." />
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-[var(--border-subtle)]">
            {allEvents.slice(0, 50).map(evt => {
              const ts = evt.timestamp.length > 19 ? evt.timestamp.substring(11, 19) : "?";
              return (
                <div key={evt.id} className="px-5 py-3 flex items-start gap-3 hover:bg-[var(--bg-tertiary)]/30">
                  <span className="text-xs text-[var(--text-muted)] font-mono shrink-0 w-14">{ts}</span>
                  <div className="w-2 h-2 rounded-full bg-[var(--border-subtle)] mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-[var(--text-secondary)]">{evt.message}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{evt.caseId}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
