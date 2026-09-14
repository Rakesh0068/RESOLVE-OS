"use client";

import { PlanStep } from "@/types";

const STEP_ICONS: Record<string, string> = {
  pending: "[ ]",
  executing: "[...]",
  completed: "[OK]",
  failed: "[X]",
  skipped: "[-]",
};

const STEP_COLORS: Record<string, string> = {
  pending: "text-text-secondary",
  executing: "text-accent-blue",
  completed: "text-accent-green",
  failed: "text-accent-red",
  skipped: "text-text-secondary",
};

export default function AgentPlan({ steps, replanCount }: { steps: PlanStep[]; replanCount: number }) {
  const completed = steps.filter((s) => s.status === "completed").length;
  const total = steps.length;

  return (
    <div className="bg-bg-secondary rounded-lg border border-bg-tertiary overflow-hidden">
      <div className="px-4 py-3 border-b border-bg-tertiary bg-bg-tertiary/50 flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <span className="text-accent-blue">[PLAN]</span>
          Agent Plan
        </h3>
        <div className="flex items-center gap-3">
          {replanCount > 0 && (
            <span className="text-xs text-accent-yellow">Replan #{replanCount}</span>
          )}
          <span className="text-xs text-text-secondary">
            {completed}/{total}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-bg-tertiary">
        <div
          className="h-1 bg-accent-blue transition-all duration-500"
          style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
        />
      </div>

      {/* Steps */}
      <div className="p-4 space-y-1">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 py-1.5 ${STEP_COLORS[step.status]} ${
              step.status === "executing" ? "bg-accent-blue/5 rounded px-2 -mx-2" : ""
            }`}
          >
            <span className="font-mono text-xs mt-0.5 w-6 shrink-0">
              {STEP_ICONS[step.status]}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-sm">{step.description}</span>
              {step.requires_approval && (
                <span className="ml-2 text-xs text-accent-yellow">[approval]</span>
              )}
            </div>
            <span className="text-xs text-text-secondary shrink-0 capitalize">
              {step.step_type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
