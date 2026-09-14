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

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--blue-950)] border border-[var(--blue-500)]/20 text-[var(--blue-400)] text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue-400)] animate-pulse-subtle" />
            Autonomous operations for your business
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Don&apos;t manage tasks.<br />
            <span className="text-[var(--text-tertiary)]">Give ResolveOS outcomes.</span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Turn operational problems into autonomous workflows. ResolveOS investigates, acts, monitors, verifies, and escalates only when necessary.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/signup" className="h-12 px-8 bg-[var(--blue-500)] hover:bg-[var(--blue-400)] text-white font-medium rounded-[var(--radius-md)] transition-colors flex items-center gap-2">
              Start resolving
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <a href="#how-it-works" className="h-12 px-8 border border-[var(--border-subtle)] hover:border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium rounded-[var(--radius-md)] transition-colors">
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
          <p className="text-[var(--text-secondary)] text-center max-w-lg mx-auto mb-16">Give an outcome. ResolveOS handles the operational workflow.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Give an outcome", desc: "Tell ResolveOS what you need. Not how to do it.", icon: "◉" },
              { step: "02", title: "ResolveOS investigates", desc: "The agent analyzes your business, checks inventory, contacts suppliers, and evaluates options.", icon: "◎" },
              { step: "03", title: "ResolveOS acts", desc: "Within your policies, it executes actions. It asks you only when your decision matters.", icon: "⬡" },
            ].map((item) => (
              <div key={item.step} className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-8">
                <div className="text-4xl mb-4 opacity-30">{item.icon}</div>
                <div className="text-xs text-[var(--text-muted)] font-mono mb-2">STEP {item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcome vs Task */}
      <section className="py-24 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Outcome &gt; Task</h2>
          <p className="text-[var(--text-secondary)] text-center max-w-lg mx-auto mb-16">Traditional task management makes you the coordinator. ResolveOS makes you the decision-maker.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-8">
              <div className="text-xs text-[var(--red-400)] font-semibold uppercase tracking-wider mb-4">Traditional</div>
              <div className="space-y-3">
                {["Create task", "Assign task", "Track task", "Follow up", "Check result"].map((t, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
                    <span className="w-5 h-5 rounded border border-[var(--border-subtle)] flex items-center justify-center text-[10px]">{i + 1}</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[var(--bg-primary)] border border-[var(--green-500)]/20 rounded-[var(--radius-lg)] p-8">
              <div className="text-xs text-[var(--green-400)] font-semibold uppercase tracking-wider mb-4">ResolveOS</div>
              <div className="space-y-3">
                {["Give outcome", "Agent handles workflow", "Agent monitors", "Agent verifies", "Human intervenes only when needed"].map((t, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
                    <span className="w-5 h-5 rounded bg-[var(--green-500)]/10 border border-[var(--green-500)]/20 flex items-center justify-center text-[var(--green-400)] text-[10px]">✓</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Built for real operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Autonomy Budget", desc: "Control exactly how much freedom ResolveOS has. Set spending limits, action caps, and risk thresholds.", icon: "◇" },
              { title: "Live Agent Timeline", desc: "Watch the agent work in real-time. Every investigation, decision, and action is visible.", icon: "≡" },
              { title: "Replanning", desc: "When plans fail, ResolveOS adapts. Automatic replanning with bounded retries.", icon: "↻" },
              { title: "Human Gates", desc: "Important decisions require your approval. The agent never acts beyond your configured limits.", icon: "⬡" },
              { title: "Verification", desc: "Action is not resolution. ResolveOS verifies outcomes before marking cases complete.", icon: "✓" },
              { title: "Business Memory", desc: "ResolveOS learns your preferences. Faster decisions over time based on your history.", icon: "△" },
            ].map((f) => (
              <div key={f.title} className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-6">
                <div className="text-2xl mb-3 opacity-40">{f.icon}</div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to resolve?</h2>
          <p className="text-[var(--text-secondary)] mb-8">Give ResolveOS an outcome. It handles the work.</p>
          <Link href="/signup" className="inline-flex h-12 px-8 bg-[var(--blue-500)] hover:bg-[var(--blue-400)] text-white font-medium rounded-[var(--radius-md)] transition-colors items-center gap-2">
            Give ResolveOS an outcome
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>ResolveOS</span>
          <span>The Autonomous Operations Agent</span>
        </div>
      </footer>
    </div>
  );
}
