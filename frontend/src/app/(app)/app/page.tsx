"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAllCases, getStats, createCase, runCase, getPendingDecisions, approveDecision } from "@/lib/store";
import type { Case, CaseDecision } from "@/data/demo";

function timeAgo(ts: string) {
  const d = Date.now() - new Date(ts).getTime();
  if (d < 60000) return "just now";
  if (d < 3600000) return `${Math.floor(d/60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d/3600000)}h ago`;
  return `${Math.floor(d/86400000)}d ago`;
}

function statusColor(s: string) {
  if (s === "resolved") return "var(--green-400)";
  if (s === "investigating" || s === "planning") return "var(--indigo-400)";
  if (s === "awaiting_approval") return "var(--amber-400)";
  if (s === "escalated" || s === "failed") return "var(--red-400)";
  return "var(--purple-400)";
}

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function riskColor(r: number) {
  if (r > 0.7) return "var(--red-400)";
  if (r > 0.4) return "var(--amber-400)";
  return "var(--green-400)";
}

// ── Stat Tile ──────────────────────────────────────────────
function StatTile({ label, value, sub, icon, trend, trendDir, accent }: {
  label: string; value: string | number; sub?: string;
  icon: string; trend?: string; trendDir?: "up" | "down" | "flat"; accent?: string;
}) {
  return (
    <div className="stat-tile card-hover" style={{ cursor: "default" }}>
      <div className="stat-tile-icon" style={{ color: accent || "var(--purple-400)" }}>
        <span style={{ fontSize: 17 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{sub}</div>}
      {trend && (
        <div style={{ marginTop: 8 }}>
          <span className={`trend trend-${trendDir || "flat"}`}>
            {trendDir === "up" ? "↑" : trendDir === "down" ? "↓" : "→"} {trend}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Mini sparkline (SVG) ───────────────────────────────────
function Sparkline({ data, color = "var(--purple-400)" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const w = 120, h = 36, n = data.length;
  const pts = data.map((v, i) => `${(i / (n-1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle key={i} cx={(i / (n-1)) * w} cy={h - (v / max) * h} r="2.5" fill={color} opacity="0.8" />
      ))}
    </svg>
  );
}

// ── Risk arc ───────────────────────────────────────────────
function RiskArc({ value, size = 80 }: { value: number; size?: number }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  const color = pct > 0.7 ? "var(--red-400)" : pct > 0.4 ? "var(--amber-400)" : "var(--green-400)";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease", filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0, monitoring: 0, needsDecision: 0, failed: 0, escalated: 0 });
  const [decisions, setDecisions] = useState<CaseDecision[]>([]);
  const [goal, setGoal] = useState("");
  const [creating, setCreating] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setCases(getAllCases());
    setStats(getStats() as any);
    setDecisions(getPendingDecisions() as any);
  }, []);

  useEffect(() => { refresh(); const t = setInterval(refresh, 3000); return () => clearInterval(t); }, [refresh]);

  const handleCreate = async () => {
    if (!goal.trim()) return;
    setCreating(true);
    const c = createCase(goal.trim());
    await runCase(c.id);
    setCreating(false);
    setGoal("");
    refresh();
    router.push(`/app/cases/${c.id}`);
  };

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    await approveDecision(id);
    refresh();
    setApprovingId(null);
  };

  const activeCases = cases.filter(c => c.status !== "resolved");
  const recentResolved = cases.filter(c => c.status === "resolved").slice(0, 3);

  // Mock sparkline data
  const agentCalls = [12, 18, 14, 24, 19, 28, 22, 31, 27, 36];
  const resolutionRate = [88, 91, 87, 94, 89, 96, 92, 98, 95, 97];

  return (
    <div style={{ padding: "28px 28px 48px", maxWidth: 1240, margin: "0 auto" }} className="animate-fade-in">

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {stats.active > 0
              ? `ResolveOS is handling ${stats.active} active outcome${stats.active > 1 ? "s" : ""}.`
              : "All outcomes resolved. System monitoring."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" style={{ gap: 5 }}>
            <span style={{ fontSize: 10 }}>🕐</span> Last 7 days
          </button>
          <Link href="/app/cases" className="btn btn-primary btn-sm">
            ↗ View Reports
          </Link>
        </div>
      </div>

      {/* ── Stat tiles ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatTile
          label="Active Outcomes" value={stats.active || 0}
          sub={`${stats.total} total lifetime`} icon="⚡"
          trend="+18.2% vs last week" trendDir="up"
          accent="var(--purple-400)"
        />
        <StatTile
          label="Autonomously Resolved" value={stats.resolved || 0}
          sub={stats.resolved > 0 ? "Last: just now" : "None yet"} icon="✓"
          trend="+23.1% vs last month" trendDir="up"
          accent="var(--green-400)"
        />
        <StatTile
          label="Decisions Required" value={stats.needsDecision || 0}
          sub={stats.needsDecision > 0 ? "Waiting for you" : "None pending"} icon="🛡"
          trend={stats.needsDecision > 0 ? "-3.2% vs last month" : "All clear"} trendDir={stats.needsDecision > 0 ? "down" : "flat"}
          accent={stats.needsDecision > 0 ? "var(--amber-400)" : "var(--text-muted)"}
        />
        <StatTile
          label="Success Rate" value={stats.total > 0 ? `${Math.round((stats.resolved / stats.total) * 100)}%` : "—"}
          sub="Verified resolutions" icon="📈"
          trend="+2.1% vs last month" trendDir="up"
          accent="var(--indigo-400)"
        />
      </div>

      {/* ── Main 2-col grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, marginBottom: 16 }}>

        {/* LEFT: Active outcomes + Create */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* New outcome input */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "var(--text-primary)" }}>
              Give ResolveOS an outcome
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  className="input"
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  placeholder="e.g. Make sure we don't run out of Precision Bearing A this week"
                  style={{ paddingRight: 12 }}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={creating || !goal.trim()}
                style={{ flexShrink: 0 }}
              >
                {creating ? <span className="animate-spin" style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block" }} /> : "Resolve →"}
              </button>
            </div>
          </div>

          {/* Active outcomes table */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Active Outcomes</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Real-time agent status</div>
              </div>
              <Link href="/app/cases" className="btn btn-ghost btn-sm">View all →</Link>
            </div>

            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 100px 80px 80px 90px",
              padding: "8px 18px", borderBottom: "1px solid var(--border-subtle)",
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              color: "var(--text-muted)",
            }}>
              <span>Outcome</span>
              <span>Status</span>
              <span>Risk</span>
              <span>Agent</span>
              <span>Updated</span>
            </div>

            {activeCases.length === 0 ? (
              <div style={{ padding: "32px 18px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                No active outcomes. Create one above.
              </div>
            ) : (
              activeCases.slice(0, 6).map(c => (
                <Link key={c.id} href={`/app/cases/${c.id}`} style={{ textDecoration: "none" }}>
                  <div className="table-row" style={{
                    display: "grid", gridTemplateColumns: "1fr 100px 80px 80px 90px",
                    padding: "10px 18px",
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>
                        {c.goal || c.title}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.id}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span className="badge badge-purple" style={{ color: statusColor(c.status), borderColor: `${statusColor(c.status)}44`, background: `${statusColor(c.status)}18` }}>
                        {statusLabel(c.status)}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <RiskArc value={c.riskLevel || 0} size={30} />
                      <span style={{ fontSize: 12, color: riskColor(c.riskLevel || 0), fontWeight: 700 }}>
                        {Math.round((c.riskLevel || 0) * 100)}%
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)", background: "var(--bg-glass)", padding: "2px 8px", borderRadius: 4 }}>
                        Strands
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {timeAgo(c.updatedAt || c.createdAt)}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Agent calls sparkline card */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Agent Execution Trends</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Tool calls and resolution rate</div>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>⋯</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>Strands Tool Calls</div>
                <Sparkline data={agentCalls} color="var(--purple-400)" />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 800 }}>36</span>
                  <span className="trend trend-up">↑ 18%</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>Resolution Rate</div>
                <Sparkline data={resolutionRate} color="var(--teal-400)" />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 800 }}>97%</span>
                  <span className="trend trend-up">↑ 2.1%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Decisions + Live agents + Risk */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Pending decisions */}
          {decisions.length > 0 && (
            <div className="card" style={{ overflow: "hidden", border: "1px solid rgba(245,158,11,0.25)" }}>
              <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
                <span className="dot dot-amber animate-pulse-dot" />
                <span style={{ fontWeight: 700, fontSize: 13 }}>Decisions Required</span>
                <span className="badge badge-high" style={{ marginLeft: "auto" }}>{decisions.length}</span>
              </div>
              {decisions.slice(0, 3).map(d => (
                <div key={d.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: "var(--text-primary)" }}>{d.actionType}</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8, lineHeight: 1.5 }}>{d.reason || "Action requires your approval"}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-success btn-sm" style={{ flex: 1 }}
                      disabled={approvingId === d.id}
                      onClick={() => handleApprove(d.id)}>
                      {approvingId === d.id ? "…" : "✓ Approve"}
                    </button>
                    <button className="btn btn-danger btn-sm" style={{ flex: 1 }}>✕ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Live Agents */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Live Strands Agents</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Background execution queue</div>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>↻ Refresh</button>
            </div>
            <div style={{ padding: "12px 14px" }}>
              {activeCases.length === 0 ? (
                <div style={{ padding: "16px 0", textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
                  No agents running
                </div>
              ) : (
                activeCases.slice(0, 3).map(c => {
                  const isRunning = !["resolved","escalated","failed"].includes(c.status);
                  const agentName = c.status === "planning" ? "PlannerAgent"
                    : c.status === "investigating" ? "InvestigatorAgent"
                    : c.status === "executing" ? "ActionAgent"
                    : c.status === "awaiting_approval" ? "Human Gate"
                    : "VerificationAgent";
                  return (
                    <div className="agent-row" key={c.id}>
                      <div className="agent-icon" style={{ background: isRunning ? "rgba(139,92,246,0.15)" : "rgba(16,185,129,0.1)" }}>
                        {isRunning ? "⚙" : "✓"}
                      </div>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {agentName}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.goal?.substring(0, 40)}…
                        </div>
                        <div style={{ marginTop: 5 }}>
                          <div className="progress-track">
                            <div className="progress-fill" style={{
                              width: c.status === "resolved" ? "100%" : c.status === "executing" ? "75%" : c.status === "investigating" ? "40%" : "20%",
                              background: isRunning ? "linear-gradient(90deg, var(--purple-500), var(--indigo-500))" : "var(--green-400)",
                            }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>aws</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, justifyContent: "flex-end" }}>
                          {isRunning
                            ? <><span className="dot dot-purple animate-pulse-dot" /><span style={{ fontSize: 10, color: "var(--purple-300)" }}>Running</span></>
                            : <><span className="dot dot-green" /><span style={{ fontSize: 10, color: "var(--green-400)" }}>Done</span></>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {activeCases.length === 0 && (
                <div className="agent-row" style={{ opacity: 0.5 }}>
                  <div className="agent-icon" style={{ background: "var(--bg-glass)" }}>🤖</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>Ready for outcomes</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Strands Agents SDK v1.55.1 · Bedrock</div>
                    <div style={{ marginTop: 5 }}>
                      <div className="progress-track"><div className="progress-fill" style={{ width: "0%" }} /></div>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Idle</span>
                </div>
              )}
            </div>
          </div>

          {/* Risk overview */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Risk Overview</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14 }}>Current portfolio health</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
              <div style={{ position: "relative", display: "inline-flex" }}>
                <RiskArc value={0.24} size={72} />
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "var(--green-400)" }}>76%</span>
                  <span style={{ fontSize: 8, color: "var(--text-muted)" }}>SAFE</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Low Risk</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>Portfolio healthy</div>
                <span className="trend trend-up">↑ 1.8% this week</span>
              </div>
            </div>
            {[
              { label: "Inventory health",   pct: 76, color: "var(--green-400)" },
              { label: "Supplier reliability", pct: 92, color: "var(--indigo-400)" },
              { label: "Active risk",        pct: 24, color: "var(--amber-400)" },
            ].map(r => (
              <div key={r.label} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{r.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.pct}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${r.pct}%`, background: r.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Recently resolved */}
          {recentResolved.length > 0 && (
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Recently Resolved</span>
              </div>
              {recentResolved.map(c => (
                <Link key={c.id} href={`/app/cases/${c.id}`} style={{ textDecoration: "none" }}>
                  <div className="table-row" style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="dot dot-green" />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.goal || c.title}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{timeAgo(c.updatedAt || c.createdAt)}</div>
                    </div>
                    <span className="badge badge-resolved">Resolved</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
