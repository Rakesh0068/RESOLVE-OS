"use client";

interface AutonomyBudgetProps {
  budget: string;
  maxReplans: number;
  replanCount: number;
}

export default function AutonomyBudget({ budget, maxReplans, replanCount }: AutonomyBudgetProps) {
  const replanUsed = replanCount;
  const replanPercent = maxReplans > 0 ? (replanUsed / maxReplans) * 100 : 0;

  return (
    <div className="bg-bg-secondary rounded-xl border border-bg-tertiary overflow-hidden">
      <div className="px-4 py-3 border-b border-bg-tertiary">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          Autonomy Budget
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Spend budget */}
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-text-secondary">Spend limit</span>
            <span className="font-mono font-medium">{budget}</span>
          </div>
          <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
            <div className="h-full bg-accent-blue rounded-full" style={{ width: "0%" }} />
          </div>
        </div>

        {/* Replans */}
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-text-secondary">Replans used</span>
            <span className="font-mono font-medium">
              {replanUsed} / {maxReplans}
            </span>
          </div>
          <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                replanPercent > 66 ? "bg-accent-red" : replanPercent > 33 ? "bg-accent-yellow" : "bg-accent-green"
              }`}
              style={{ width: `${replanPercent}%` }}
            />
          </div>
        </div>

        {/* Risk threshold */}
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Risk threshold</span>
          <span className="font-mono font-medium">80%</span>
        </div>

        {/* Policy summary */}
        <div className="pt-2 border-t border-bg-tertiary">
          <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">Current Policy</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-accent-green">●</span>
              <span>Routine actions → automatic</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent-green">●</span>
              <span>Purchases &lt; 10K → automatic</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent-yellow">●</span>
              <span>Purchases &ge; 10K → approval</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent-red">●</span>
              <span>Supplier changes → approval</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
