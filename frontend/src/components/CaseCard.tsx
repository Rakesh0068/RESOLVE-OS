"use client";

import Link from "next/link";
import { Case } from "@/types";

const STATUS_CONFIG: Record<string, { color: string; dot: string; label: string }> = {
  open: { color: "border-accent-blue", dot: "bg-accent-blue", label: "Open" },
  investigating: { color: "border-accent-blue", dot: "bg-accent-blue", label: "Investigating" },
  planning: { color: "border-accent-purple", dot: "bg-accent-purple", label: "Planning" },
  awaiting_approval: { color: "border-accent-red", dot: "bg-accent-red animate-pulse-dot", label: "Approval Required" },
  executing: { color: "border-accent-yellow", dot: "bg-accent-yellow", label: "Executing" },
  monitoring: { color: "border-accent-yellow", dot: "bg-accent-yellow animate-pulse-dot", label: "Monitoring" },
  resolved: { color: "border-accent-green", dot: "bg-accent-green", label: "Resolved" },
  escalated: { color: "border-accent-red", dot: "bg-accent-red", label: "Escalated" },
};

export default function CaseCard({ caseData }: { caseData: Case }) {
  const config = STATUS_CONFIG[caseData.status] || STATUS_CONFIG.open;

  return (
    <Link href={`/cases/${caseData.id}`}>
      <div className={`bg-bg-secondary rounded-lg p-4 border-l-4 ${config.color} hover:bg-bg-tertiary transition-colors cursor-pointer`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${config.dot}`} />
              <span className="text-xs text-text-secondary uppercase tracking-wide">{config.label}</span>
            </div>
            <h3 className="font-medium text-foreground truncate">{caseData.title}</h3>
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">{caseData.goal}</p>
          </div>
          <div className="ml-4 text-right shrink-0">
            {caseData.plan_progress && (
              <div className="text-xs text-text-secondary">
                {caseData.plan_progress} steps
              </div>
            )}
            {caseData.replan_count > 0 && (
              <div className="text-xs text-accent-yellow mt-1">
                Replan #{caseData.replan_count}
              </div>
            )}
            {caseData.risk_level > 0 && (
              <div className={`text-xs mt-1 ${caseData.risk_level > 0.7 ? "text-accent-red" : "text-accent-yellow"}`}>
                Risk: {Math.round(caseData.risk_level * 100)}%
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
