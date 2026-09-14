"use client";

import { PlanStep } from "@/types";

const PIPELINE_STAGES = [
  { key: "understand", label: "UNDERSTAND", stepTypes: [] },
  { key: "plan", label: "PLAN", stepTypes: ["plan"] },
  { key: "investigate", label: "INVESTIGATE", stepTypes: ["investigate"] },
  { key: "act", label: "ACT", stepTypes: ["act"] },
  { key: "verify", label: "VERIFY", stepTypes: ["verify"] },
  { key: "resolve", label: "RESOLVE", stepTypes: [] },
];

function getStageStatus(
  stage: typeof PIPELINE_STAGES[0],
  steps: PlanStep[],
  caseStatus: string
): "completed" | "active" | "failed" | "pending" {
  if (caseStatus === "resolved") return "completed";

  // Check if any steps of this type exist
  const stageSteps = steps.filter((s) => stage.stepTypes.includes(s.step_type));

  if (stage.key === "understand" || stage.key === "plan") {
    // These are always completed if we have steps
    if (steps.length > 0) return "completed";
  }

  if (stage.key === "resolve") {
    if (caseStatus === "resolved") return "completed";
    if (caseStatus === "escalated") return "failed";
    return "pending";
  }

  if (stageSteps.length === 0) return "pending";

  const hasFailed = stageSteps.some((s) => s.status === "failed");
  if (hasFailed) return "failed";

  const allCompleted = stageSteps.every((s) => s.status === "completed");
  if (allCompleted) return "completed";

  const anyExecuting = stageSteps.some(
    (s) => s.status === "executing" || s.status === "pending"
  );
  if (anyExecuting) return "active";

  return "pending";
}

export default function Pipeline({ steps, status }: { steps: PlanStep[]; status: string }) {
  return (
    <div className="bg-bg-secondary rounded-xl border border-bg-tertiary p-5">
      <div className="flex items-center justify-between">
        {PIPELINE_STAGES.map((stage, i) => {
          const stageStatus = getStageStatus(stage, steps, status);

          return (
            <div key={stage.key} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                {/* Status icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    stageStatus === "completed"
                      ? "bg-accent-green/20 border-accent-green text-accent-green"
                      : stageStatus === "active"
                      ? "bg-accent-blue/20 border-accent-blue text-accent-blue animate-pulse-dot"
                      : stageStatus === "failed"
                      ? "bg-accent-red/20 border-accent-red text-accent-red"
                      : "bg-bg-tertiary border-bg-tertiary text-text-secondary"
                  }`}
                >
                  {stageStatus === "completed" ? "✓" : stageStatus === "active" ? "◉" : stageStatus === "failed" ? "✕" : "○"}
                </div>
                {/* Label */}
                <span
                  className={`text-[10px] font-semibold tracking-wider ${
                    stageStatus === "active"
                      ? "text-accent-blue"
                      : stageStatus === "completed"
                      ? "text-foreground"
                      : "text-text-secondary"
                  }`}
                >
                  {stage.label}
                </span>
              </div>

              {/* Connector line */}
              {i < PIPELINE_STAGES.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-2 mt-[-20px] ${
                    stageStatus === "completed" ? "bg-accent-green" : "bg-bg-tertiary"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
