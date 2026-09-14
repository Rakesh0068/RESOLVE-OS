"use client";

import { Case } from "@/types";
import OutcomeContract from "./OutcomeContract";
import AgentPlan from "./AgentPlan";
import ActivityFeed from "./ActivityFeed";
import ApprovalGate from "./ApprovalGate";

interface CaseDetailProps {
  caseData: Case;
  onApprove: () => void;
  onReject: () => void;
  onBack: () => void;
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: "bg-accent-blue/20", text: "text-accent-blue", label: "Open" },
  investigating: { bg: "bg-accent-blue/20", text: "text-accent-blue", label: "Investigating" },
  planning: { bg: "bg-accent-purple/20", text: "text-accent-purple", label: "Planning" },
  awaiting_approval: { bg: "bg-accent-red/20", text: "text-accent-red", label: "Awaiting Approval" },
  executing: { bg: "bg-accent-yellow/20", text: "text-accent-yellow", label: "Executing" },
  monitoring: { bg: "bg-accent-yellow/20", text: "text-accent-yellow", label: "Monitoring" },
  resolved: { bg: "bg-accent-green/20", text: "text-accent-green", label: "Resolved" },
  escalated: { bg: "bg-accent-red/20", text: "text-accent-red", label: "Escalated" },
};

export default function CaseDetail({ caseData, onApprove, onReject, onBack }: CaseDetailProps) {
  const badge = STATUS_BADGE[caseData.status] || STATUS_BADGE.open;
  const pendingApproval = caseData.pending_approvals?.find((a) => a.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-bg-tertiary bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="text-text-secondary hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold">{caseData.title}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">{caseData.id}</p>
          </div>
          {caseData.risk_level > 0 && (
            <div className={`text-right ${caseData.risk_level > 0.7 ? "text-accent-red" : "text-accent-yellow"}`}>
              <div className="text-2xl font-bold">{Math.round(caseData.risk_level * 100)}%</div>
              <div className="text-xs text-text-secondary">Risk</div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Contract + Plan */}
          <div className="lg:col-span-2 space-y-6">
            {/* Outcome Contract */}
            {caseData.outcome_contract && (
              <OutcomeContract contract={caseData.outcome_contract} />
            )}

            {/* Agent Plan */}
            {caseData.current_plan && caseData.current_plan.length > 0 && (
              <AgentPlan steps={caseData.current_plan} replanCount={caseData.replan_count} />
            )}
          </div>

          {/* Right Column - Activity + Approval */}
          <div className="lg:col-span-3 space-y-6">
            {/* Approval Gate */}
            {pendingApproval && (
              <ApprovalGate
                approval={pendingApproval}
                onApprove={onApprove}
                onReject={onReject}
              />
            )}

            {/* Activity Feed */}
            <ActivityFeed events={caseData.activity_log || []} />
          </div>
        </div>
      </main>
    </div>
  );
}
