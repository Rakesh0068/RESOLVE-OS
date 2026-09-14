"use client";

import { Card } from "@/components/ui";

const POLICIES = [
  { name: "Autonomous purchase", trigger: "Purchase amount < Rs.10,000", action: "Execute automatically", active: true },
  { name: "Approval purchase", trigger: "Purchase amount >= Rs.10,000", action: "Request approval", active: true },
  { name: "Supplier change", trigger: "Changing primary supplier", action: "Request approval", active: true },
  { name: "Auto refund", trigger: "Refund amount < Rs.5,000", action: "Execute automatically", active: true },
  { name: "Approval refund", trigger: "Refund amount >= Rs.5,000", action: "Request approval", active: true },
  { name: "Risk escalation", trigger: "Risk level > 80%", action: "Escalate to human", active: true },
  { name: "Replan limit", trigger: "Replans exhausted (3)", action: "Escalate to human", active: true },
];

export default function PoliciesPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Business Policies</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Rules that govern ResolveOS autonomy</p>
      </div>
      <div className="space-y-3">
        {POLICIES.map((p, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between">
              <div className="grid grid-cols-3 gap-8 flex-1">
                <div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Policy</div>
                  <div className="text-sm font-medium">{p.name}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">IF</div>
                  <div className="text-sm text-[var(--text-secondary)]">{p.trigger}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">THEN</div>
                  <div className="text-sm text-[var(--text-secondary)]">{p.action}</div>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${p.active ? "bg-[var(--green-500)]" : "bg-[var(--bg-tertiary)]"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${p.active ? "left-5" : "left-0.5"}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
