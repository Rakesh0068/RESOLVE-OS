"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getStats, subscribeCases } from "@/lib/store";
import type { Case } from "@/data/demo";

const NAV = [
  { section: null, items: [
    { href: "/app", label: "Overview", icon: "◉" },
    { href: "/app/cases", label: "Cases", icon: "◎" },
    { href: "/app/decisions", label: "Decisions", icon: "⬡" },
    { href: "/app/monitoring", label: "Monitoring", icon: "◔" },
    { href: "/app/activity", label: "Activity", icon: "≡" },
  ]},
  { section: "Business", items: [
    { href: "/app/inventory", label: "Inventory", icon: "▦" },
    { href: "/app/suppliers", label: "Suppliers", icon: "◈" },
    { href: "/app/orders", label: "Orders", icon: "▤" },
    { href: "/app/invoices", label: "Invoices", icon: "▧" },
  ]},
  { section: "Control", items: [
    { href: "/app/policies", label: "Policies", icon: "⊞" },
    { href: "/app/autonomy", label: "Autonomy", icon: "⟡" },
    { href: "/app/settings", label: "Settings", icon: "⚙" },
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
      {/* Sidebar */}
      <aside className="w-56 bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--blue-500)] flex items-center justify-center font-bold text-white text-sm">R</div>
            <div>
              <div className="font-semibold text-sm">ResolveOS</div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{user.businessName}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
          {NAV.map((section, si) => (
            <div key={si}>
              {section.section && (
                <div className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">{section.section}</div>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors ${
                        active ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/50"
                      }`}>
                      <span className="w-4 text-center text-xs opacity-50">{item.icon}</span>
                      {item.label}
                      {item.href === "/app/decisions" && stats.needsDecision > 0 && (
                        <span className="ml-auto text-[10px] bg-[var(--red-500)] text-white px-1.5 py-0.5 rounded-full font-bold">{stats.needsDecision}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-medium">{user.name.charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{user.name}</div>
              <div className="text-[10px] text-[var(--text-muted)] truncate">{user.email}</div>
            </div>
          </div>
          <button onClick={signout} className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors py-1">Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-secondary)]">
              {stats.active > 0 ? `Handling ${stats.active} issue${stats.active !== 1 ? "s" : ""}` : "All clear"}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green-500)] animate-pulse-subtle" />
              <span className="text-[var(--text-muted)]">System Active</span>
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
