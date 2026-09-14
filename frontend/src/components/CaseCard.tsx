"use client";

import Link from "next/link";
import { Case } from "@/types";

const STATUS_CONFIG: Record<string, { color: string; dot: string; label: string }> = {
  open: { color: "border-accent-blue", dot: "bg-accent-blue", label: "Open" },
  investigating: { color: "border-accent-blue", dot: "bg-accent-blue", label: "Investigating" },
  planning: { color: "border-accent-purple", dot: "bg-accent-purple", label: "Planning" },
  awaiting_approval: { color: "border-accent-red", dot: "bg-accent-red animate-pulse-dot", label: "Decision Required" },
  executing: { color: "border-accent-yellow", dot: "bg-accent-yellow", label: "Executing" },
  monitoring: { color: "border-accent-yellow", dot: "bg-accent-yellow animate-pulse-dot", label: "Monitoring" },
  resolved: { color: "border-accent-green", dot: "bg-accent-green", label: "Resolved" },
  escalated: { color: "border-accent-red", dot: "bg-accent-red", label: "Escalated" },
};

export default function CaseCard({ caseData, urgent }: { caseData: Case; urgent?: boolean }) {
  const config = STATUS_CONFIG[caseData.status] || STATUS_CONFIG.open;

  return (
    <Link href={`/cases/${caseData.id}`}>
      <div
        className={`rounded-lg p-4 border-l-4 transition-all cursor-pointer ${
          urgent
            ? `bg-accent-red/5 border-accent-red hover:bg-accent-red/10`
            : `bg-bg-secondary ${config.color} hover:bg-bg-tertiary`
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${config.dot}`} />
              <span className="text-xs text-text-secondary uppercase tracking-wide font-medium">
                {config.label}
              </span>
            </div>
            <h3 className="font-medium text-foreground truncate">{caseData.title}</h3>
            <p className="text-sm text-text-secondary mt-0.5 line-clamp-1">{caseData.goal}</p>
          </div>

          <div className="ml-4 flex items-center gap-4 shrink-0">
            {caseData.risk_level > 0 && (
              <div className={`text-right ${caseData.risk_level > 0.7 ? "text-accent-red" : "text-accent-yellow"}`}>
                <div className="text-lg font-bold font-mono">{Math.round(caseData.risk_level * 100)}%</div>
                <div className="text-[10px] text-text-secondary uppercase">Risk</div>
              </div>
            )}
            {caseData.plan_progress && (
              <div className="text-xs text-text-secondary font-mono">
                {caseData.plan_progress}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
