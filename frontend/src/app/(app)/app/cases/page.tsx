"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllCases, createCase, runCase } from "@/lib/store";
import type { Case } from "@/data/demo";

const FILTERS = [
  { key: "all",               label: "All" },
  { key: "active",            label: "Active" },
  { key: "awaiting_approval", label: "Decision required" },
  { key: "monitoring",        label: "Monitoring" },
  { key: "resolved",          label: "Resolved" },
];

function statusColor(s: string) {
  if (s === "resolved")          return "var(--green-400)";
  if (s === "awaiting_approval") return "var(--amber-400)";
  if (s === "monitoring")        return "var(--indigo-400)";
  if (s === "escalated" || s === "failed") return "var(--red-400)";
  return "var(--purple-400)";
}

function timeAgo(ts: string) {
  const d = Date.now() - new Date(ts).getTime();
  if (d < 60000) return "just now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

export default function CasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [filter, setFilter] = useState("all");
  const [goal, setGoal] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { setCases(getAllCases()); }, []);

  const count = (key: string) => {
    if (key === "all") return cases.length;
    if (key === "active") return cases.filter(c => !["resolved","escalated","failed"].includes(c.status)).length;
    return cases.filter(c => c.status === key).length;
  };

  const filtered = cases.filter(c => {
    if (filter === "all") return true;
    if (filter === "active") return !["resolved","escalated","failed"].includes(c.status);
    return c.status === filter;
  });

  const handleCreate = async () => {
    if (!goal.trim()) return;
    setCreating(true);
    const c = createCase(goal.trim());
    await runCase(c.id);
    setCreating(false);
    setGoal("");
    router.push(`/app/cases/${c.id}`);
  };

  return (
    <div style={{ padding: "28px 28px 48px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Cases</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>All operational cases managed by ResolveOS</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <input
            style={{
              height: 36, padding: "0 14px",
              background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
              borderRadius: 8, color: "var(--text-primary)", fontSize: 13,
              width: 280,
            }}
            placeholder="New outcome... (Enter to resolve)"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={handleCreate}
            disabled={creating || !goal.trim()}
          >
            {creating ? "…" : "Resolve →"}
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: "flex", gap: 4,
        padding: "4px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 10,
        marginBottom: 20,
        width: "fit-content",
      }}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          const c = count(f.key);
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 7,
                fontSize: 12, fontWeight: active ? 700 : 500,
                border: "none", cursor: "pointer",
                background: active ? "var(--bg-primary)" : "transparent",
                color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: active ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}
            >
              {f.label}
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                minWidth: 18, height: 16, borderRadius: 8,
                fontSize: 10, fontWeight: 700, padding: "0 4px",
                background: active ? "var(--bg-elevated)" : "rgba(255,255,255,0.05)",
                color: active ? "var(--text-secondary)" : "var(--text-muted)",
              }}>
                {c}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cases list */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "64px 24px",
          background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
          borderRadius: 12, color: "var(--text-muted)", fontSize: 13,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
          <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>No cases</div>
          <div>No cases match this filter. Give ResolveOS an outcome above.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(c => {
            const sColor = statusColor(c.status);
            return (
              <Link key={c.id} href={`/app/cases/${c.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10, padding: "14px 18px",
                  display: "flex", alignItems: "center", gap: 14,
                  transition: "border-color 0.12s, background 0.12s",
                  cursor: "pointer",
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border-default)"; el.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border-subtle)"; el.style.background = "var(--bg-elevated)"; }}
                >
                  {/* Status dot */}
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: sColor, boxShadow: `0 0 6px ${sColor}`,
                  }} />

                  {/* Title + ID */}
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
                      marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {(c as any).goal || c.title}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {c.id} · {timeAgo((c as any).updatedAt || (c as any).createdAt || "")}
                    </div>
                  </div>

                  {/* Risk */}
                  {((c as any).riskLevel || (c as any).riskScore || 0) > 0 && (
                    <div style={{
                      fontSize: 12, fontWeight: 700,
                      color: ((c as any).riskLevel || 0) > 0.7 || ((c as any).riskScore || 0) > 70
                        ? "var(--red-400)" : "var(--text-tertiary)",
                      fontFamily: "var(--font-mono)", flexShrink: 0,
                    }}>
                      {Math.round(((c as any).riskLevel || 0) * 100 || (c as any).riskScore || 0)}%
                    </div>
                  )}

                  {/* Status badge */}
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px",
                    borderRadius: 20, flexShrink: 0,
                    background: `color-mix(in srgb, ${sColor} 12%, transparent)`,
                    color: sColor,
                    border: `1px solid color-mix(in srgb, ${sColor} 28%, transparent)`,
                    textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>
                    {c.status.replace(/_/g, " ")}
                  </span>

                  {/* Arrow */}
                  <span style={{ color: "var(--text-muted)", fontSize: 14, flexShrink: 0 }}>›</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
