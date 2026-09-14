"use client";

import { DashboardStats } from "@/types";

interface StatsBarProps {
  stats: DashboardStats;
}

export default function StatsBar({ stats }: StatsBarProps) {
  const items = [
    { label: "Active Cases", value: stats.active, color: "text-accent-blue" },
    { label: "Resolved", value: stats.resolved, color: "text-accent-green" },
    { label: "Monitoring", value: stats.monitoring, color: "text-accent-yellow" },
    { label: "Needs Decision", value: stats.needs_decision, color: "text-accent-red" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {items.map((item) => (
        <div key={item.label} className="bg-bg-secondary rounded-lg p-4 border border-bg-tertiary">
          <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
          <div className="text-text-secondary text-sm mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
