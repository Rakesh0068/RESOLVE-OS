"use client";

import { Case } from "@/types";
import OutcomeContractCard from "./OutcomeContract";
import AgentPlan from "./AgentPlan";
import ActivityFeed from "./ActivityFeed";
import ApprovalGate from "./ApprovalGate";
import Pipeline from "./Pipeline";
import AutonomyBudget from "./AutonomyBudget";

interface CaseDetailProps {
  caseData: Case;
  onApprove: () => void;
  onReject: () => void;
  onBack: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  open: "OPEN",
  investigating: "INVESTIGATING",
  planning: "PLANNING",
  awaiting_approval: "DECISION REQUIRED",
  executing: "EXECUTING",
  monitoring: "MONITORING",
  resolved: "RESOLVED",
  escalated: "ESCALATED",
};

export default function CaseDetail({ caseData, onApprove, onReject, onBack }: CaseDetailProps) {
  const pendingApproval = caseData.pending_approvals?.find((a) => a.status === "pending");
  const isResolved = caseData.status === "resolved";
  const statusLabel = STATUS_LABELS[caseData.status] || caseData.status.toUpperCase();

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={onBack}
                className="text-text-secondary hover:text-foreground transition-colors text-sm"
              >
                Back
              </button>
              <span className="text-text-secondary">/</span>
              <span className="text-xs font-mono text-text-secondary">{caseData.id}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">{caseData.title}</h1>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span className={`font-medium ${
                caseData.status === "resolved" ? "text-accent-green" :
                caseData.status === "awaiting_approval" ? "text-accent-red" :
                caseData.status === "monitoring" ? "text-accent-yellow" :
                "text-accent-blue"
              }`}>
                {statusLabel}
              </span>
              {caseData.risk_level > 0 && (
                <span className={`font-mono font-bold ${
                  caseData.risk_level > 0.7 ? "text-accent-red" :
                  caseData.risk_level > 0.4 ? "text-accent-yellow" :
                  "text-accent-green"
                }`}>
                  {Math.round(caseData.risk_level * 100)}% risk
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline */}
        {caseData.current_plan && caseData.current_plan.length > 0 && (
          <Pipeline steps={caseData.current_plan} status={caseData.status} />
        )}

        {/* Resolution Summary */}
        {isResolved && (
          <div className="bg-accent-green/5 border border-accent-green/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-accent-green text-2xl">✓</span>
              <div>
                <h2 className="text-lg font-bold text-accent-green">Outcome Resolved</h2>
                <p className="text-sm text-text-secondary">Goal achieved successfully</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{caseData.replan_count}</div>
                <div className="text-xs text-text-secondary">Replans</div>
              </div>
              <div>
                <div className="text-2xl font-bold">1</div>
                <div className="text-xs text-text-secondary">Human decisions</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">
                  {caseData.current_plan?.filter((s) => s.status === "completed").length || 0}
                </div>
                <div className="text-xs text-text-secondary">Actions taken</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">0</div>
                <div className="text-xs text-text-secondary">Unresolved issues</div>
              </div>
            </div>
          </div>
        )}

        {/* Approval Gate */}
        {pendingApproval && (
          <ApprovalGate approval={pendingApproval} onApprove={onApprove} onReject={onReject} />
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-1 space-y-6">
            {caseData.outcome_contract && (
              <OutcomeContractCard contract={caseData.outcome_contract} />
            )}
            <AutonomyBudget
              budget={caseData.outcome_contract?.budget || "N/A"}
              maxReplans={caseData.outcome_contract?.max_replans || 3}
              replanCount={caseData.replan_count}
            />
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            {caseData.current_plan && caseData.current_plan.length > 0 && (
              <AgentPlan steps={caseData.current_plan} replanCount={caseData.replan_count} />
            )}
            <ActivityFeed events={caseData.activity_log || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
