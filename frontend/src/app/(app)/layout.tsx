"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getStats, subscribeCases } from "@/lib/store";
import type { Case } from "@/data/demo";

const NAV = [
  { section: null, items: [
    { href: "/app", label: "Overview", icon: "dashboard" },
    { href: "/app/cases", label: "Cases", icon: "list" },
    { href: "/app/decisions", label: "Decisions", icon: "gavel" },
    { href: "/app/monitoring", label: "Monitoring", icon: "eye" },
    { href: "/app/activity", label: "Activity", icon: "log" },
  ]},
  { section: "Business", items: [
    { href: "/app/inventory", label: "Inventory", icon: "box" },
    { href: "/app/suppliers", label: "Suppliers", icon: "users" },
    { href: "/app/orders", label: "Orders", icon: "briefcase" },
    { href: "/app/invoices", label: "Invoices", icon: "receipt" },
  ]},
  { section: "Control", items: [
    { href: "/app/policies", label: "Policies", icon: "settings" },
    { href: "/app/autonomy", label: "Autonomy", icon: "slider-horizontal" },
    { href: "/app/settings", label: "Settings", icon: "power" },
  ]},
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState(getStats());

  useEffect(() => {
    if (!loading && !user) router.push("/signin");
    if (!loading && user && !user.onboardingComplete) router.push("/onboarding");
  }, [user, loading, router]);

  useEffect(() => {
    const unsub = subscribeCases(() => setStats(getStats()));
    return () => { unsub(); };
  }, []);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center text-[var(--text-muted)]">Loading...</div>;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — 240px, quiet, notification counts */}
      <aside className="w-24 bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] flex flex-col shrink-0 transition-width hover:w-64">
        {/* Collapsed brand only */}
        <div className="px-4 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[var(--blue-500)] flex items-center justify-center font-bold text-white text-sm">R</div>
            <span className="hidden sm:block font-semibold text-sm">ResolveOS</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-2">
          {NAV.map((section, si) => (
            <div key={si}>
              {section.section && (
                <div className="px-2 mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{section.section}</div>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        active ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/50"
                      } w-full sm:wh-auto justify-between`}
                    >
                      <span className="w-3 text-center text-xs opacity-60">{item.icon}</span>
                      <span>{item.label}</span>
                      {item.href === "/app/decisions" && stats.needsDecision > 0 && (
                        <span className="ml-2 text-[10px] bg-[var(--red-500)] text-white px-1.5 py-0.5 rounded-full font-bold">{stats.needsDecision}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-[var(--border-subtle)]">
          <button onClick={signout} className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors py-1 flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[var(--red-500)]" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar — condensed, operational */}
        <header className="h-12 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-secondary)]">
              {stats.active > 0 ? `Handling ${stats.active} issue${stats.active !== 1 ? "s" : ""}` : "All clear"}
            </span>
          </div>
          <div className="flex items-center gap-3 hidden sm:flex">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green-500)]" />
              <span className="text-[var(--text-muted)]">System Active</span>
            </span>
            <div className="relative">
              <button className="rounded-full p-1.5 hover:bg-[var(--bg-tertiary)] transition-colors" aria-label="Notifications">
                <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A21.954 21.954 0 0112 21c-4.425 0-8-3.575-8-8a4.958 4.958 0 002.095-6.864L5 10l1.405 1.405A7.978 7.978 0 013 12c0 4.425 3.575 8 8 8z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10v9l12-3v-9z" /></svg>
              </button>
              <div className="absolute right-0 top-2 w-32 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-md px-3 py-2 text-xs text-[var(--text-secondary)] hidden">
                <span className="font-medium text-[var(--text-primary)]">3 new</span>
                <div className="mt-1 text-[var(--text-muted)]/60">• Supplier delivery changed</div>
                <div className="mt-1 text-[var(--text-muted)]/60">• Decision required</div>
                <div className="mt-1 text-[var(--text-muted)]/60">• Inventory low</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}