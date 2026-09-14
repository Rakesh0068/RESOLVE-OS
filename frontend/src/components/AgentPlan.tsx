"use client";

import { PlanStep } from "@/types";

const STATUS_ICONS: Record<string, { icon: string; color: string }> = {
  pending: { icon: "○", color: "text-text-secondary" },
  executing: { icon: "◉", color: "text-accent-blue" },
  completed: { icon: "✓", color: "text-accent-green" },
  failed: { icon: "✕", color: "text-accent-red" },
  skipped: { icon: "—", color: "text-text-secondary" },
};

export default function AgentPlan({ steps, replanCount }: { steps: PlanStep[]; replanCount: number }) {
  const completed = steps.filter((s) => s.status === "completed").length;
  const total = steps.length;

  return (
    <div className="bg-bg-secondary rounded-xl border border-bg-tertiary overflow-hidden">
      <div className="px-4 py-3 border-b border-bg-tertiary flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          Current Plan
        </h3>
        <div className="flex items-center gap-3">
          {replanCount > 0 && (
            <span className="text-[10px] text-accent-yellow font-mono px-2 py-0.5 bg-accent-yellow/10 rounded">
              Replan #{replanCount}
            </span>
          )}
          <span className="text-xs text-text-secondary font-mono">
            {completed}/{total}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-bg-tertiary">
        <div
          className="h-1 bg-accent-blue rounded-full transition-all duration-700"
          style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
        />
      </div>

      {/* Steps */}
      <div className="p-4 space-y-1">
        {steps.map((step) => {
          const config = STATUS_ICONS[step.status] || STATUS_ICONS.pending;
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 py-2 px-2 rounded-md transition-colors ${
                step.status === "executing" ? "bg-accent-blue/5" : ""
              }`}
            >
              <span className={`text-sm ${config.color} w-5 text-center`}>{config.icon}</span>
              <span
                className={`text-sm flex-1 ${
                  step.status === "completed"
                    ? "text-foreground/70"
                    : step.status === "executing"
                    ? "text-foreground font-medium"
                    : "text-text-secondary"
                }`}
              >
                {step.description}
              </span>
              {step.requires_approval && (
                <span className="text-[10px] text-accent-yellow font-mono px-1.5 py-0.5 bg-accent-yellow/10 rounded">
                  approval
                </span>
              )}
              <span className="text-[10px] text-text-secondary font-mono uppercase w-16 text-right">
                {step.step_type}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
