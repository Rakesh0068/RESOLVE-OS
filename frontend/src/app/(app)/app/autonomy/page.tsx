"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, Progress } from "@/components/ui";

export default function AutonomyPage() {
  const { user } = useAuth();
  const prefs = user?.autonomyPrefs;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Autonomy</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Control how much freedom ResolveOS has</p>
      </div>

      <Card className="p-6">
        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-4">Current Autonomy Level</div>
        <div className="flex items-center gap-8 mb-6">
          {["Observe", "Recommend", "Execute", "Monitor", "Escalate"].map((level, i) => (
            <div key={level} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                i <= 3 ? "bg-[var(--blue-500)]/20 border-2 border-[var(--blue-500)] text-[var(--blue-400)]" :
                "bg-[var(--bg-tertiary)] border-2 border-[var(--border-subtle)] text-[var(--text-muted)]"
              }`}>{i + 1}</div>
              <span className="text-xs text-[var(--text-secondary)]">{level}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Max autonomous purchase</div>
          <div className="text-2xl font-bold font-mono">Rs.{prefs?.maxAutonomousPurchase.toLocaleString()}</div>
          <Progress value={prefs?.maxAutonomousPurchase || 0} max={100000} color="blue" size="sm" />
        </Card>
        <Card className="p-5">
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Risk threshold</div>
          <div className="text-2xl font-bold font-mono">{prefs?.riskThreshold}%</div>
          <Progress value={prefs?.riskThreshold || 0} color={prefs?.riskThreshold && prefs.riskThreshold > 70 ? "amber" : "green"} size="sm" />
        </Card>
        <Card className="p-5">
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Max replans</div>
          <div className="text-2xl font-bold font-mono">{prefs?.maxReplans}</div>
        </Card>
        <Card className="p-5">
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Max auto refund</div>
          <div className="text-2xl font-bold font-mono">Rs.{prefs?.maxAutoRefund.toLocaleString()}</div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">How autonomy works</div>
        <div className="space-y-2 text-sm text-[var(--text-secondary)]">
          <p>ResolveOS operates within the boundaries you define. It investigates, plans, and acts automatically for routine operations.</p>
          <p>When an action exceeds your configured limits — such as a purchase over Rs.{prefs?.maxAutonomousPurchase.toLocaleString()} — ResolveOS pauses and requests your approval.</p>
          <p>You can adjust these settings at any time. Changes take effect immediately for new cases.</p>
        </div>
      </Card>
    </div>
  );
}
