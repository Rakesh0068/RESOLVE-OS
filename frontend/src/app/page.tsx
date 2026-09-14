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
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>

      {/* ── Navigation ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(5,8,22,0.85)", backdropFilter: "blur(16px)",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "0 24px",
          height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 7,
              background: "var(--blue-500)", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontWeight: 800, color: "#fff", fontSize: 14,
            }}>R</div>
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>ResolveOS</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/signin" style={{
              fontSize: 13, color: "var(--text-secondary)", textDecoration: "none",
              transition: "color 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              Sign in
            </Link>
            <Link href="/signup" style={{
              fontSize: 13, fontWeight: 600,
              background: "var(--blue-500)", color: "#fff",
              padding: "8px 18px", borderRadius: 6,
              textDecoration: "none", transition: "background 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--blue-400)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--blue-500)")}
            >
              Start resolving →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ paddingTop: 100, paddingBottom: 80, padding: "100px 24px 80px" }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 64, alignItems: "center",
        }}>

          {/* LEFT: Copy */}
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "4px 12px", borderRadius: 20,
              background: "rgba(79,124,255,0.08)",
              border: "1px solid rgba(79,124,255,0.2)",
              color: "var(--blue-400)", fontSize: 11, fontWeight: 600,
              letterSpacing: "0.05em", textTransform: "uppercase",
              marginBottom: 20,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--blue-400)", display: "inline-block" }} />
              AWS Strands Agents · Autonomous Operations
            </div>

            <h1 style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800, lineHeight: 1.15,
              letterSpacing: "-0.03em", marginBottom: 20,
              color: "var(--text-primary)",
            }}>
              Don&apos;t manage tasks.
              <br />
              <span style={{
                background: "linear-gradient(135deg, var(--blue-400), var(--indigo-400), var(--violet-400))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Resolve outcomes.
              </span>
            </h1>

            <p style={{
              fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7,
              marginBottom: 32, maxWidth: 480,
            }}>
              ResolveOS investigates operational problems, plans actions, executes
              permitted work, monitors what happens, replans when reality changes,
              and verifies the final outcome. Powered by AWS Strands Agents.
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <Link href="/signup" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                height: 44, padding: "0 24px", borderRadius: 7,
                background: "var(--blue-500)", color: "#fff",
                fontWeight: 600, fontSize: 14, textDecoration: "none",
                transition: "background 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--blue-400)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--blue-500)")}
              >
                Resolve an outcome
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/signin" style={{
                display: "inline-flex", alignItems: "center", height: 44,
                padding: "0 20px", borderRadius: 7,
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)", fontSize: 14, fontWeight: 500,
                textDecoration: "none", transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                See how it works
              </Link>
            </div>
          </div>

          {/* RIGHT: Outcome Core — CSS/SVG visualization (always visible) */}
          <OutcomeCore />
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" style={{
        padding: "72px 24px",
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--bg-secondary)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--blue-400)", textAlign: "center", marginBottom: 12 }}>
            Autonomous workflow
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: "center", marginBottom: 8 }}>How ResolveOS works</h2>
          <p style={{ color: "var(--text-secondary)", textAlign: "center", marginBottom: 48, fontSize: 14 }}>
            Give an outcome. The agent handles the rest.
          </p>
          <div style={{ display: "flex", gap: 0, alignItems: "flex-start", overflowX: "auto" }}>
            {[
              { step: "01", title: "Outcome Contract", desc: "Define a goal, success condition, budget, and deadline. This becomes the source of truth.", color: "var(--blue-400)" },
              { step: "02", title: "Investigation", desc: "InvestigatorAgent checks inventory, supplier history, purchase orders. No invented data.", color: "var(--indigo-400)" },
              { step: "03", title: "Planning", desc: "PlannerAgent creates a structured execution plan based on real evidence from tools.", color: "var(--violet-400)" },
              { step: "04", title: "Human Gate", desc: "When an action exceeds ₹10,000 or is irreversible, execution pauses for your approval.", color: "var(--amber-400)" },
              { step: "05", title: "Action + Verify", desc: "ActionAgent executes. VerificationAgent proves the outcome was actually achieved.", color: "var(--green-400)" },
            ].map((item, i) => (
              <div key={item.step} style={{ flex: 1, minWidth: 160, padding: "0 16px", position: "relative" }}>
                {i < 4 && (
                  <div style={{
                    position: "absolute", top: 20, right: -1, width: 2, height: 2,
                    borderTop: "1px dashed var(--border-default)", transform: "translateY(-50%)",
                    width: "100%",
                  }} />
                )}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  border: `1.5px solid ${item.color}`,
                  background: `color-mix(in srgb, ${item.color} 10%, transparent)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: item.color,
                  marginBottom: 12,
                }}>
                  {item.step}
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{item.title}</h3>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo scenario strip ── */}
      <section style={{ padding: "64px 24px", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Demo scenario</p>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 32 }}>Northstar Components — Stockout Prevention</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { label: "Current stock", value: "120 units", sub: "Precision Bearing A", color: "var(--amber-400)" },
              { label: "Daily usage", value: "40 units/day", sub: "Projected stockout: 3 days", color: "var(--red-400)" },
              { label: "Supplier B", value: "₹44,500", sub: "100 units × ₹445 — Approval required", color: "var(--blue-400)" },
              { label: "Human Gate", value: "Triggered", sub: "Exceeds ₹10,000 autonomous limit", color: "var(--amber-400)" },
              { label: "Replan", value: "Activated", sub: "Supplier B delayed 2→5 days", color: "var(--red-400)" },
              { label: "Resolution", value: "RESOLVED ✓", sub: "Verification passed", color: "var(--green-400)" },
            ].map(item => (
              <div key={item.label} style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8, padding: "16px 20px",
              }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.value}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AWS Architecture ── */}
      <section style={{
        padding: "64px 24px",
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--bg-secondary)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Powered by AWS Strands Agents</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 32, maxWidth: 560 }}>
            Strands Agents SDK is the actual autonomous engine — not a wrapper or a cosmetic import.
            Each specialized agent is a real <code style={{ background: "var(--bg-elevated)", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>strands.Agent</code> backed by Amazon Bedrock.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {[
              { name: "Strands Agents", role: "Agent orchestration", tag: "CORE" },
              { name: "Amazon Bedrock", role: "Foundation model (Nova/Claude)", tag: "LLM" },
              { name: "PlannerAgent", role: "Creates execution plans via LLM", tag: "AGENT" },
              { name: "InvestigatorAgent", role: "Read-only fact gathering", tag: "AGENT" },
              { name: "ActionAgent", role: "Executes approved actions", tag: "AGENT" },
              { name: "VerificationAgent", role: "Proves outcome achieved", tag: "AGENT" },
              { name: "Human Gate", role: "Deterministic approval pause", tag: "POLICY" },
              { name: "DynamoDB", role: "Persistent case state", tag: "AWS" },
            ].map(item => (
              <div key={item.name} style={{
                background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
                borderRadius: 7, padding: "14px 16px",
              }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: item.tag === "CORE" ? "var(--blue-400)" : item.tag === "AGENT" ? "var(--indigo-400)" : item.tag === "POLICY" ? "var(--amber-400)" : "var(--green-400)",
                  marginBottom: 6,
                }}>{item.tag}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{item.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "72px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: "-0.03em" }}>
          Ready to resolve?
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 32 }}>
          Give ResolveOS an outcome. It handles the operational workflow.
        </p>
        <Link href="/signup" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          height: 48, padding: "0 32px", borderRadius: 8,
          background: "var(--blue-500)", color: "#fff",
          fontWeight: 700, fontSize: 15, textDecoration: "none",
          boxShadow: "0 0 32px rgba(79,124,255,0.25)",
        }}>
          Get started
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid var(--border-subtle)",
        padding: "20px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        maxWidth: 1100, margin: "0 auto",
        fontSize: 12, color: "var(--text-muted)",
      }}>
        <span style={{ fontWeight: 600 }}>ResolveOS</span>
        <span>Built for the AWS Strands Agents Hackathon</span>
      </footer>
    </div>
  );
}


/* ── Outcome Core visualization — pure CSS, always visible ── */
function OutcomeCore() {
  const nodes = [
    { label: "PLAN",      angle: -90,  color: "#6366F1" },
    { label: "EVIDENCE",  angle: -30,  color: "#4F7CFF" },
    { label: "ACTION",    angle: 30,   color: "#34D399" },
    { label: "VERIFY",    angle: 90,   color: "#8B5CF6" },
    { label: "MONITOR",   angle: 150,  color: "#FBBF24" },
    { label: "H.GATE",    angle: 210,  color: "#FB7185" },
  ];

  const r = 88; // orbit radius

  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 16, padding: 32,
      display: "flex", flexDirection: "column", alignItems: "center",
      boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 0 80px rgba(79,124,255,0.03)",
      minHeight: 360,
      position: "relative", overflow: "hidden",
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 240, height: 240, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(79,124,255,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 16, textTransform: "uppercase" }}>
        Outcome Core
      </div>

      {/* SVG orbit diagram */}
      <svg width="260" height="260" viewBox="-130 -130 260 260" style={{ overflow: "visible" }}>
        {/* Orbit ring */}
        <circle cx="0" cy="0" r={r} fill="none" stroke="rgba(79,124,255,0.12)" strokeWidth="1" strokeDasharray="4 6" />

        {/* Connection lines from center to nodes */}
        {nodes.map((n) => {
          const rad = (n.angle * Math.PI) / 180;
          const x = Math.cos(rad) * r;
          const y = Math.sin(rad) * r;
          return (
            <line key={n.label} x1="0" y1="0" x2={x} y2={y}
              stroke={n.color} strokeWidth="0.5" opacity="0.25" />
          );
        })}

        {/* Orbital nodes */}
        {nodes.map((n) => {
          const rad = (n.angle * Math.PI) / 180;
          const x = Math.cos(rad) * r;
          const y = Math.sin(rad) * r;
          return (
            <g key={n.label} transform={`translate(${x},${y})`}>
              <circle r="18" fill={`color-mix(in srgb, ${n.color} 12%, #0E1630)`}
                stroke={n.color} strokeWidth="1" opacity="0.9" />
              <text x="0" y="4" textAnchor="middle"
                fontFamily="ui-monospace, monospace"
                fontSize="6.5" fontWeight="700" fill={n.color}
                letterSpacing="0.04em">
                {n.label}
              </text>
            </g>
          );
        })}

        {/* Center — Outcome */}
        <circle cx="0" cy="0" r="30"
          fill="color-mix(in srgb, #4F7CFF 15%, #0E1630)"
          stroke="#4F7CFF" strokeWidth="1.5" />
        <text x="0" y="-4" textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontSize="8" fontWeight="800" fill="#6EA8FF" letterSpacing="0.06em">
          OUTCOME
        </text>
        <text x="0" y="10" textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontSize="6" fill="#4F7CFF" opacity="0.7" letterSpacing="0.06em">
          CORE
        </text>
      </svg>

      {/* Workflow strip below */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        marginTop: 16, fontSize: 10, fontWeight: 700,
        letterSpacing: "0.06em", color: "var(--text-muted)",
        textTransform: "uppercase",
      }}>
        {["PLAN", "→", "ACT", "→", "MONITOR", "→", "VERIFY"].map((item, i) => (
          <span key={i} style={{
            color: item === "→" ? "var(--border-strong)"
              : i === 0 ? "var(--indigo-400)"
              : i === 2 ? "var(--green-400)"
              : i === 4 ? "var(--amber-400)"
              : "var(--violet-400)",
            fontSize: item === "→" ? 12 : 10,
          }}>
            {item}
          </span>
        ))}
      </div>

      <div style={{
        marginTop: 12, fontSize: 10, color: "var(--text-muted)",
        textAlign: "center", maxWidth: 200, lineHeight: 1.5,
      }}>
        Powered by AWS Strands Agents + Amazon Bedrock
      </div>
    </div>
  );
}
