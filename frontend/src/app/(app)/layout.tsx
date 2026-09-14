"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getStats, subscribeCases } from "@/lib/store";

// ── SVG icons (inline, no icon library needed) ─────────────
function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const s = size;
  const icons: Record<string, JSX.Element> = {
    dashboard: <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth={1.8}/><rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth={1.8}/><rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth={1.8}/><rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth={1.8}/></svg>,
    cases:     <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
    decisions: <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
    monitoring:<svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
    activity:  <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    inventory: <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
    suppliers: <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
    orders:    <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
    invoices:  <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>,
    policies:  <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>,
    autonomy:  <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>,
    settings:  <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3" strokeWidth={1.8}/></svg>,
    bell:      <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
    sun:       <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="5" strokeWidth={1.8}/><path strokeWidth={1.8} strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
    user:      <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
    logout:    <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>,
    search:    <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8" strokeWidth={1.8}/><path strokeWidth={1.8} strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>,
  };
  return icons[name] || <span style={{ width: s, height: s, display: "inline-block" }} />;
}

// ── Nav structure ───────────────────────────────────────────
const NAV_GROUPS = [
  {
    section: null,
    items: [
      { href: "/app",              label: "Overview",   icon: "dashboard"  },
      { href: "/app/cases",        label: "Cases",      icon: "cases"      },
      { href: "/app/decisions",    label: "Decisions",  icon: "decisions",  badge: "decisions" },
      { href: "/app/monitoring",   label: "Monitoring", icon: "monitoring" },
      { href: "/app/activity",     label: "Activity",   icon: "activity"   },
    ],
  },
  {
    section: "Business",
    items: [
      { href: "/app/inventory",  label: "Inventory",  icon: "inventory" },
      { href: "/app/suppliers",  label: "Suppliers",  icon: "suppliers" },
      { href: "/app/orders",     label: "Orders",     icon: "orders"    },
      { href: "/app/invoices",   label: "Invoices",   icon: "invoices"  },
    ],
  },
  {
    section: "Control",
    items: [
      { href: "/app/policies",  label: "Policies",  icon: "policies"  },
      { href: "/app/autonomy",  label: "Autonomy",  icon: "autonomy"  },
      { href: "/app/settings",  label: "Settings",  icon: "settings"  },
    ],
  },
];

// ── Layout ──────────────────────────────────────────────────
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState({ needsDecision: 0, active: 0 });
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/signin");
    if (!loading && user && !user.onboardingComplete) router.push("/onboarding");
  }, [user, loading, router]);

  useEffect(() => {
    const unsub = subscribeCases(() => setStats(getStats() as any));
    setStats(getStats() as any);
    return unsub;
  }, []);

  if (loading || !user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
          <div className="animate-spin" style={{ width: 24, height: 24, border: "2px solid var(--border-subtle)", borderTop: "2px solid var(--purple-500)", borderRadius: "50%", margin: "0 auto 12px" }} />
          Loading...
        </div>
      </div>
    );
  }

  const W = expanded ? 220 : 60;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-base)" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: W, minWidth: W,
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex", flexDirection: "column",
        transition: "width 0.2s ease, min-width 0.2s ease",
        overflow: "hidden", position: "relative", zIndex: 10,
        flexShrink: 0,
      }}>
        {/* Brand */}
        <div style={{
          padding: "16px 14px", display: "flex", alignItems: "center",
          gap: 10, borderBottom: "1px solid var(--border-subtle)",
          minHeight: 60, overflow: "hidden",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: "var(--gradient-brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, color: "#fff", fontSize: 15,
            boxShadow: "0 2px 10px rgba(124,58,237,0.5)",
            cursor: "pointer",
          }} onClick={() => setExpanded(e => !e)}>
            R
          </div>
          {expanded && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", whiteSpace: "nowrap" }}>ResolveOS</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Autonomous Ops</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 8px" }}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 4 }}>
              {group.section && expanded && (
                <div className="section-label" style={{ paddingLeft: 6 }}>{group.section}</div>
              )}
              {group.section && !expanded && <div style={{ borderTop: "1px solid var(--border-subtle)", margin: "8px 4px" }} />}
              {group.items.map(item => {
                const active = item.href === "/app"
                  ? pathname === "/app"
                  : pathname.startsWith(item.href);
                const badgeCount = item.badge === "decisions" ? (stats.needsDecision || 0) : 0;
                return (
                  <Link key={item.href} href={item.href}
                    className={`nav-item ${active ? "active" : ""}`}
                    title={!expanded ? item.label : undefined}
                    style={{
                      justifyContent: expanded ? "flex-start" : "center",
                      padding: expanded ? "8px 10px" : "9px",
                      marginBottom: 2,
                    }}
                  >
                    <span style={{ flexShrink: 0, color: active ? "var(--purple-400)" : "var(--text-tertiary)" }}>
                      <Icon name={item.icon} size={17} />
                    </span>
                    {expanded && <span style={{ fontSize: 13 }}>{item.label}</span>}
                    {expanded && badgeCount > 0 && (
                      <span className="nav-badge">{badgeCount}</span>
                    )}
                    {!expanded && badgeCount > 0 && (
                      <span style={{
                        position: "absolute", top: 4, right: 4,
                        width: 8, height: 8, borderRadius: "50%",
                        background: "var(--red-500)",
                      }} />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom user */}
        <div style={{ padding: "10px 8px", borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 8px", borderRadius: 10,
            cursor: "pointer", transition: "background 0.15s",
            justifyContent: expanded ? "flex-start" : "center",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, var(--purple-600), var(--indigo-500))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff",
            }}>
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            {expanded && (
              <div style={{ overflow: "hidden", flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.businessName}</div>
              </div>
            )}
            {expanded && (
              <button onClick={signout}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, borderRadius: 4, flexShrink: 0 }}
                title="Sign out"
                onMouseEnter={e => (e.currentTarget.style.color = "var(--red-400)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                <Icon name="logout" size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          height: 56, flexShrink: 0,
          background: "linear-gradient(90deg, rgba(16,16,31,0.95), rgba(20,20,43,0.95))",
          borderBottom: "1px solid var(--border-subtle)",
          backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", gap: 16,
        }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "0 0 auto" }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
              <Icon name="search" size={14} />
            </span>
            <input
              className="search-bar"
              placeholder="Search cases, outcomes..."
            />
          </div>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Status */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 20,
              background: "var(--bg-glass)", border: "1px solid var(--border-subtle)",
              fontSize: 12, color: "var(--text-secondary)",
            }}>
              <span className="dot dot-green animate-pulse-dot" />
              <span>System Active</span>
            </div>

            {/* Bell */}
            <button style={{
              width: 34, height: 34, borderRadius: 9,
              background: "var(--bg-glass)", border: "1px solid var(--border-subtle)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-muted)", cursor: "pointer",
              position: "relative",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-glass)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
            >
              <Icon name="bell" size={15} />
              {(stats.needsDecision || 0) > 0 && (
                <span style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", background: "var(--red-500)" }} />
              )}
            </button>

            {/* Theme */}
            <button style={{
              width: 34, height: 34, borderRadius: 9,
              background: "var(--bg-glass)", border: "1px solid var(--border-subtle)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-muted)", cursor: "pointer",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-glass)"; }}
            >
              <Icon name="sun" size={15} />
            </button>

            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "var(--gradient-brand)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#fff",
              cursor: "pointer", flexShrink: 0,
              boxShadow: "0 0 0 2px var(--border-accent)",
            }}>
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto", background: "var(--bg-primary)" }}>
          {/* Subtle purple glow top-right */}
          <div style={{
            position: "fixed", top: 56, right: 0,
            width: 500, height: 300, pointerEvents: "none", zIndex: 0,
            background: "radial-gradient(ellipse at top right, rgba(139,92,246,0.06) 0%, transparent 70%)",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
