"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.onboardingComplete) {
      router.push("/app");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--blue-500)] flex items-center justify-center font-bold text-white text-sm">R</div>
            <span className="font-semibold text-lg">ResolveOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/signin" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Sign in</Link>
            <Link href="/signup" className="text-sm font-medium bg-[var(--blue-500)] hover:bg-[var(--blue-400)] text-white px-4 py-2 rounded-[var(--radius-md)] transition-colors">Start resolving</Link>
          </div>
        </div>
      </nav>

      {/* Hero — Product-driven layout per §5-6 */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* LEFT: Operational copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--blue-950)] border border-[var(--blue-500)]/20 text-[var(--blue-400)] text-xs font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue-400)] animate-pulse-subtle" />
              Autonomous operations
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-[1.25] mb-4">
              Give ResolveOS an outcome
            </h1>
            <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed mb-6">
              ResolveOS investigates operational problems, takes permitted actions, monitors what happens, and escalates only when a decision actually requires you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/signup" className="flex-1 h-10 px-4 bg-[var(--blue-500)] hover:bg-[var(--blue-400)] text-white font-medium rounded-md transition-colors text-center">
                Resolve this
              </Link>
              <a href="#how-it-works" className="h-10 border border-[var(--border-subtle)] hover:border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium rounded-md transition-colors text-center">
                How it works
              </a>
            </div>
          </div>

          {/* RIGHT: Actual product preview per §6 */}
          <div className="relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--bg-secondary)] rounded-[var(--radius-lg)] overflow-hidden opacity-80">
              <svg className="w-full h-full" viewBox="0 0 200 160" fill="none">
                <rect width="200" height="160" rx="12" fill="var(--bg-tertiary)" />
                <rect width="80" height="40" x="60" y="60" rx="6" fill="var(--blue-500)" />
                <text x="100" y="95" text-anchor="middle" font-family="var(--font-geist-sans)" font-size="11" fill="var(--text-primary)">Case</text>
                <text x="100" y="110" text-anchor="middle" font-family="var(--font-geist-sans)" font-size="11" fill="var(--text-secondary)">Panel</text>
              </svg>
            </div>
            <div className="absolute inset-0 bg-[var(--bg-primary)] rounded-[var(--radius-lg)] overflow-hidden">
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--amber-500)]" />
                  <span className="text-sm text-[var(--text-secondary)]">12m ago</span>
                </div>
                <div className="mt-2 text-xs text-[var(--text-muted)]">Inventory risk detected</div>
              </div>
              <div className="absolute bottom-4 right-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--green-500)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Monitoring</span>
                </div>
                <div className="mt-2 text-xs text-[var(--text-muted)]">Stock safe</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — condensed per §7 */}
      <section id="how-it-works" className="py-16 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-3">How it works</h2>
          <p className="text-[var(--text-secondary)] text-center mb-8">Give an outcome. ResolveOS handles the operational workflow.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[{"step": "01", "title": "Give outcome", "desc": "Tell ResolveOS what you need. Not how to do it."}, {"step": "02", "title": "Agent investigates", "desc": "The agent analyzes your business, checks inventory, contacts suppliers, evaluates options."}, {"step": "03", "title": "Agent acts", "desc": "Within your policies, it executes actions. It asks you only when your decision matters."}].map((item) => (
              <div key={item.step} className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg p-5 text-center">
                <div className="text-3xl mb-3 opacity-40">{item.step}</div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcome vs Task */}
      <section className="py-16 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-3">Outcome > Task</h2>
          <p className="text-[var(--text-secondary)] text-center mb-8">Traditional task management makes you the coordinator. ResolveOS makes you the decision-maker.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg p-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--red-400)] mb-3">Traditional</div>
              <ul className="text-sm text-[var(--text-tertiary)] space-y-2">
                <li className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--border-subtle)] flex items-center justify-center text-[8px]">1</span> Create task</li>
                <li className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--border-subtle)] flex items-center justify-center text-[8px]">2</span> Assign task</li>
                <li className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--border-subtle)] flex items-center justify-center text-[8px]">3</span> Track task</li>
                <li className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--border-subtle)] flex items-center justify-center text-[8px]">4</span> Follow up</li>
                <li className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--border-subtle)] flex items-center justify-center text-[8px]">5</span> Check result</li>
              </ul>
            </div>
            <div className="bg-[var(--bg-primary)] border border-[var(--green-500)]/20 rounded-lg p-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--green-400)] mb-3">ResolveOS</div>
              <ul className="text-sm text-[var(--text-primary)] space-y-2">
                <li className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--green-500)]/10 border border-[var(--green-500)]/20 flex items-center justify-center text-[var(--green-400)] text-[8px]">✓</span> Give outcome</li>
                <li className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--green-500)]/10 border border-[var(--green-500)]/20 flex items-center justify-center text-[var(--green-400)] text-[8px]">✓</span> Agent handles workflow</li>
                <li className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--green-500)]/10 border border-[var(--green-500)]/20 flex items-center justify-center text-[var(--green-400)] text-[8px]">✓</span> Agent monitors</li>
                <li className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--green-500)]/10 border border-[var(--green-500)]/20 flex items-center justify-center text-[var(--green-400)] text-[8px]">✓</span> Agent verifies</li>
                <li className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--green-500)]/10 border border-[var(--green-500)]/20 flex items-center justify-center text-[var(--green-400)] text-[8px]">✓</span> Human intervenes only when needed</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key sections as compact info, not feature cards */}
      <section className="py-16 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-4">What ResolveOS handles</h2>
          <p className="text-[var(--text-secondary)] text-center mb-6">Built for real operations</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[{"title": "Stockout prevention", "desc": "Detects inventory shortage risk, compares suppliers, recommends action before stockout occurs"}, {"title": "Invoice discrepancy", "desc": "Identifies PO mismatches, contacts suppliers, processes corrections within policy limits"}, {"title": "Decision gates", "desc": "Pauses for approval when actions exceed autonomous limits (e.g., ₹10,000 purchase limit)"}, {"title": "Monitoring", "desc": "Tracks deliveries, supplier delays, risk levels. Escalates only when outcome threatened"}]} .map((f) => (
              <div key={f.title} className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg p-5 flex items-start gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0">{f.title.includes("Stockout") ? "⚠" : f.title.includes("Invoice") ? "📄" : f.title.includes("Decision") ? "🔒" : "👁"}</div>
                <div>
                  <h3 className="font-medium mb-1">{f.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to resolve?</h2>
          <p className="text-[var(--text-secondary)] mb-6">Give ResolveOS an outcome. It handles the work.</p>
          <Link href="/signup" className="inline-flex h-10 px-6 bg-[var(--blue-500)] hover:bg-[var(--blue-400)] text-white font-medium rounded-md transition-colors items-center gap-2">
            Give ResolveOS an outcome
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>ResolveOS</span>
          <span>The Autonomous Operations Agent</span>
        </div>
      </footer>
    </div>
  );
}