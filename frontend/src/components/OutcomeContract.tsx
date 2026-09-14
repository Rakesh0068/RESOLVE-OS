"use client";

import { OutcomeContract } from "@/types";

export default function OutcomeContractCard({ contract }: { contract: OutcomeContract }) {
  return (
    <div className="bg-bg-secondary rounded-xl border border-bg-tertiary overflow-hidden">
      <div className="px-4 py-3 border-b border-bg-tertiary flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          Outcome Contract
        </h3>
        <span className="text-[10px] text-accent-purple font-mono px-2 py-0.5 bg-accent-purple/10 rounded">
          ACTIVE
        </span>
      </div>

      <div className="p-4 space-y-5">
        {/* Goal */}
        <div>
          <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Goal</div>
          <div className="text-sm font-medium leading-relaxed">{contract.goal}</div>
        </div>

        {/* Success Criteria */}
        <div className="bg-accent-green/5 border border-accent-green/10 rounded-lg p-3">
          <div className="text-[10px] text-accent-green uppercase tracking-wider mb-1 font-semibold">
            Success
          </div>
          <div className="text-sm text-accent-green/90">{contract.success_criteria}</div>
        </div>

        {/* Constraints */}
        <div>
          <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">Constraints</div>
          <div className="space-y-1.5">
            {contract.constraints.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-accent-yellow text-xs mt-0.5">—</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Budget + Replans */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-tertiary/50 rounded-lg p-3">
            <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Budget</div>
            <div className="text-lg font-bold font-mono">{contract.budget}</div>
          </div>
          <div className="bg-bg-tertiary/50 rounded-lg p-3">
            <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Max Replans</div>
            <div className="text-lg font-bold font-mono">{contract.max_replans}</div>
          </div>
        </div>

        {/* Deadline */}
        {contract.deadline && (
          <div>
            <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Deadline</div>
            <div className="text-sm font-medium">{contract.deadline}</div>
          </div>
        )}

        {/* Escalation Rules */}
        <div>
          <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">
            Escalation Rules
          </div>
          <div className="space-y-1">
            {contract.escalation_rules.map((r, i) => (
              <div key={i} className="text-xs text-text-secondary flex items-start gap-2">
                <span className="text-accent-red text-xs mt-0.5">!</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
