"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input } from "@/components/ui";

const STEPS = ["Business", "Focus areas", "Autonomy"];

const FOCUS_OPTIONS = [
  { id: "inventory", label: "Inventory", desc: "Stock levels, shortages, reorders" },
  { id: "suppliers", label: "Suppliers", desc: "Delivery, reliability, alternatives" },
  { id: "invoices", label: "Invoices", desc: "Discrepancies, approvals, payments" },
  { id: "customers", label: "Customers", desc: "Complaints, orders, refunds" },
  { id: "orders", label: "Orders", desc: "Purchase and customer orders" },
  { id: "maintenance", label: "Maintenance", desc: "Equipment, repairs, schedules" },
];

export default function OnboardingPage() {
  const { user, completeOnboarding } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [business, setBusiness] = useState({ industry: "", teamSize: "", area: "" });
  const [focusAreas, setFocusAreas] = useState<string[]>(["inventory", "suppliers"]);
  const [autonomy, setAutonomy] = useState({ maxPurchase: 10000, riskThreshold: 80, maxReplans: 3 });

  if (!user) {
    router.push("/signin");
    return null;
  }

  const toggleFocus = (id: string) => {
    setFocusAreas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleComplete = () => {
    completeOnboarding({
      industry: business.industry || "General",
      autonomyPrefs: {
        maxAutonomousPurchase: autonomy.maxPurchase,
        supplierChangesRequireApproval: true,
        maxAutoRefund: 5000,
        riskThreshold: autonomy.riskThreshold,
        maxReplans: autonomy.maxReplans,
      },
    });
    router.push("/app");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full ${i <= step ? "bg-[var(--blue-500)]" : "bg-[var(--bg-tertiary)]"}`} />
              <div className={`text-[10px] mt-1 ${i === step ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>{s}</div>
            </div>
          ))}
        </div>

        {/* Step 0: Business */}
        {step === 0 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Tell us about your business</h1>
              <p className="text-sm text-[var(--text-secondary)]">This helps ResolveOS understand your operations.</p>
            </div>
            <Input label="Industry" placeholder="e.g., Food & Beverage, Manufacturing" value={business.industry} onChange={e => setBusiness(b => ({ ...b, industry: e.target.value }))} />
            <Input label="Team size" placeholder="e.g., 5-20" value={business.teamSize} onChange={e => setBusiness(b => ({ ...b, teamSize: e.target.value }))} />
            <Input label="Primary operating area" placeholder="e.g., Mumbai, Bangalore" value={business.area} onChange={e => setBusiness(b => ({ ...b, area: e.target.value }))} />
            <Button onClick={() => setStep(1)} className="w-full">Continue</Button>
          </div>
        )}

        {/* Step 1: Focus Areas */}
        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">What should ResolveOS handle?</h1>
              <p className="text-sm text-[var(--text-secondary)]">Select the operational areas you want to automate.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {FOCUS_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => toggleFocus(opt.id)}
                  className={`p-4 rounded-[var(--radius-lg)] border text-left transition-all ${
                    focusAreas.includes(opt.id)
                      ? "bg-[var(--blue-950)] border-[var(--blue-500)]/40"
                      : "bg-[var(--bg-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                  }`}
                >
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(0)} className="flex-1">Back</Button>
              <Button onClick={() => setStep(2)} className="flex-1">Continue</Button>
            </div>
          </div>
        )}

        {/* Step 2: Autonomy */}
        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Autonomy preferences</h1>
              <p className="text-sm text-[var(--text-secondary)]">Control how much freedom ResolveOS has. You can change these later.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Max autonomous purchase</label>
                <div className="flex items-center gap-3 mt-2">
                  <input type="range" min={1000} max={100000} step={1000} value={autonomy.maxPurchase}
                    onChange={e => setAutonomy(a => ({ ...a, maxPurchase: +e.target.value }))}
                    className="flex-1 accent-[var(--blue-500)]" />
                  <span className="font-mono text-sm w-24 text-right">Rs.{autonomy.maxPurchase.toLocaleString()}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">Purchases below this amount are executed automatically</p>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Risk threshold</label>
                <div className="flex items-center gap-3 mt-2">
                  <input type="range" min={30} max={100} step={5} value={autonomy.riskThreshold}
                    onChange={e => setAutonomy(a => ({ ...a, riskThreshold: +e.target.value }))}
                    className="flex-1 accent-[var(--blue-500)]" />
                  <span className="font-mono text-sm w-24 text-right">{autonomy.riskThreshold}%</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">ResolveOS escalates when risk exceeds this threshold</p>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Max replans</label>
                <div className="flex items-center gap-3 mt-2">
                  <input type="range" min={1} max={5} step={1} value={autonomy.maxReplans}
                    onChange={e => setAutonomy(a => ({ ...a, maxReplans: +e.target.value }))}
                    className="flex-1 accent-[var(--blue-500)]" />
                  <span className="font-mono text-sm w-24 text-right">{autonomy.maxReplans}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">Maximum number of plan adaptations before escalating</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={handleComplete} className="flex-1">Start resolving</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
