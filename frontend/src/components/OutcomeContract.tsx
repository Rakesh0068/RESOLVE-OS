"use client";

import { OutcomeContract } from "@/types";

export default function OutcomeContractCard({ contract }: { contract: OutcomeContract }) {
  return (
    <div className="bg-bg-secondary rounded-lg border border-bg-tertiary overflow-hidden">
      <div className="px-4 py-3 border-b border-bg-tertiary bg-bg-tertiary/50">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <span className="text-accent-purple">[#]</span>
          Outcome Contract
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {/* Goal */}
        <div>
          <div className="text-xs text-text-secondary uppercase tracking-wide mb-1">Goal</div>
          <div className="text-sm font-medium">{contract.goal}</div>
        </div>

        {/* Constraints */}
        <div>
          <div className="text-xs text-text-secondary uppercase tracking-wide mb-1">Constraints</div>
          <ul className="space-y-1">
            {contract.constraints.map((c, i) => (
              <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                <span className="text-accent-yellow mt-0.5">*</span>
                {c}
              </li>
            ))}
          </ul>
        </div>

        {/* Success */}
        <div>
          <div className="text-xs text-text-secondary uppercase tracking-wide mb-1">Success Criteria</div>
          <div className="text-sm text-accent-green">{contract.success_criteria}</div>
        </div>

        {/* Budget + Replans */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-text-secondary uppercase tracking-wide mb-1">Budget</div>
            <div className="text-sm font-mono font-medium">{contract.budget}</div>
          </div>
          <div>
            <div className="text-xs text-text-secondary uppercase tracking-wide mb-1">Max Replans</div>
            <div className="text-sm font-mono font-medium">{contract.max_replans}</div>
          </div>
        </div>

        {/* Deadline */}
        <div>
          <div className="text-xs text-text-secondary uppercase tracking-wide mb-1">Deadline</div>
          <div className="text-sm">{contract.deadline}</div>
        </div>

        {/* Escalation Rules */}
        <div>
          <div className="text-xs text-text-secondary uppercase tracking-wide mb-1">Escalation Rules</div>
          <ul className="space-y-1">
            {contract.escalation_rules.map((r, i) => (
              <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                <span className="text-accent-red mt-0.5">!</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
