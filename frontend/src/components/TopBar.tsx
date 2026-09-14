"use client";

interface TopBarProps {
  stats?: {
    active: number;
    resolved: number;
    monitoring: number;
    needs_decision: number;
  };
}

export default function TopBar({ stats }: TopBarProps) {
  return (
    <header className="h-14 border-b border-bg-tertiary bg-bg-secondary/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Command bar trigger */}
      <button className="flex items-center gap-3 px-4 py-2 bg-bg-tertiary/50 rounded-lg border border-bg-tertiary hover:border-text-secondary/30 transition-colors text-sm text-text-secondary w-80">
        <span className="text-xs opacity-50">⌘K</span>
        <span>What needs to be resolved?</span>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-6">
        {stats && (
          <div className="hidden md:flex items-center gap-4 text-xs">
            {stats.needs_decision > 0 && (
              <span className="flex items-center gap-1.5 text-accent-red font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse-dot" />
                {stats.needs_decision} decision{stats.needs_decision !== 1 ? "s" : ""}
              </span>
            )}
            <span className="text-text-secondary">
              {stats.active} active
            </span>
            <span className="text-accent-green">
              {stats.resolved} resolved
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse-dot" />
          <span className="text-xs text-text-secondary font-medium">System Active</span>
        </div>
      </div>
    </header>
  );
}
