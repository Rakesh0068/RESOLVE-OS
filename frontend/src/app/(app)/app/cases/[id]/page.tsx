"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCase, approveDecision } from "@/lib/store";
import { PRODUCTS, getSupplierAlternatives } from "@/data/demo";
import type { Case, CaseEvent } from "@/data/demo";
import { Button, Badge, Card, Progress, showToast } from "@/components/ui";

const PIPELINE_STAGES = ["UNDERSTAND", "PLAN", "INVESTIGATE", "ACT", "VERIFY", "RESOLVE"];

function getPipelineStatus(c: Case) {
  const statuses: Record<string, "completed" | "active" | "pending" | "failed"> = {
    UNDERSTAND: "completed", PLAN: "completed", INVESTIGATE: "pending", ACT: "pending", VERIFY: "pending", RESOLVE: "pending",
  };
  switch (c.status) {
    case "created": statuses.UNDERSTAND = "active"; break;
    case "understanding": statuses.UNDERSTAND = "active"; break;
    case "planning": statuses.INVESTIGATE = "active"; break;
    case "investigating": statuses.INVESTIGATE = "active"; break;
    case "decision_required": statuses.ACT = "active"; break;
    case "executing": statuses.ACT = "active"; break;
    case "monitoring": statuses.VERIFY = "active"; break;
    case "replanning": statuses.INVESTIGATE = "active"; break;
    case "verifying": statuses.VERIFY = "active"; break;
    case "resolved": Object.keys(statuses).forEach(k => statuses[k] = "completed"); break;
    case "failed": statuses.RESOLVE = "failed"; break;
    case "escalated": statuses.ACT = "failed"; break;
  }
  return statuses;
}

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [showWhy, setShowWhy] = useState<string | null>(null);
  const router = useRouter();
  const eventsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then(p => {
      const c = getCase(p.id);
      if (c) setCaseData(c);
      else router.push("/app/cases");
    });
  }, [params, router]);

  useEffect(() => {
    if (eventsRef.current) eventsRef.current.scrollTop = eventsRef.current.scrollHeight;
  }, [caseData?.events.length]);

  if (!caseData) return <div className="p-8 text-[var(--text-muted)]">Loading case...</div>;

  const pipeline = getPipelineStatus(caseData);
  const pendingDecision = caseData.decisions.find(d => d.status === "pending");
  const resolved = caseData.status === "resolved";
  const alternatives = getSupplierAlternatives("PROD-001");

  const handleApprove = async (decisionId: string) => {
    await approveDecision(decisionId);
    const updated = getCase(caseData.id);
    if (updated) setCaseData({ ...updated });
    showToast("Approved and executing");
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between animate-slide-up">
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-2">
              <button onClick={() => router.push("/app/cases")} className="hover:text-[var(--text-secondary)] transition-colors">Cases</button>
              <span>/</span>
              <span className="font-mono">{caseData.id}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">{caseData.title}</h1>
            <div className="flex items-center gap-4">
              <Badge variant={resolved ? "green" : caseData.status === "decision_required" ? "red" : caseData.status === "monitoring" ? "amber" : "blue"} pulse={!resolved}>
                {caseData.status.replace(/_/g, " ").toUpperCase()}
              </Badge>
              {caseData.riskScore > 0 && (
                <span className={`font-mono font-bold ${caseData.riskScore > 70 ? "text-[var(--red-400)]" : caseData.riskScore > 40 ? "text-[var(--amber-400)]" : "text-[var(--green-400)]"}`}>
                  {caseData.riskScore}% risk
                </span>
              )}
              {caseData.deadline && <span className="text-xs text-[var(--text-tertiary)]">Deadline: {caseData.deadline}</span>}
            </div>
          </div>
        </div>

        {/* Pipeline */}
        <Card className="p-5 animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <div className="flex items-center justify-between">
            {PIPELINE_STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    pipeline[stage] === "completed" ? "bg-[var(--green-500)]/20 border-[var(--green-500)] text-[var(--green-400)]" :
                    pipeline[stage] === "active" ? "bg-[var(--blue-500)]/20 border-[var(--blue-500)] text-[var(--blue-400)] animate-pulse-subtle" :
                    pipeline[stage] === "failed" ? "bg-[var(--red-500)]/20 border-[var(--red-500)] text-[var(--red-400)]" :
                    "bg-[var(--bg-tertiary)] border-[var(--border-subtle)] text-[var(--text-muted)]"
                  }`}>
                    {pipeline[stage] === "completed" ? "✓" : pipeline[stage] === "active" ? "◉" : pipeline[stage] === "failed" ? "✕" : "○"}
                  </div>
                  <span className={`text-[10px] font-semibold tracking-wider ${
                    pipeline[stage] === "active" ? "text-[var(--blue-400)]" :
                    pipeline[stage] === "completed" ? "text-[var(--text-primary)]" :
                    "text-[var(--text-muted)]"
                  }`}>{stage}</span>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className={`w-10 h-0.5 mx-2 mt-[-20px] ${pipeline[stage] === "completed" ? "bg-[var(--green-500)]" : "bg-[var(--border-subtle)]"}`} />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Resolution Summary */}
        {resolved && caseData.resolution && (
          <Card className="p-6 border-[var(--green-500)]/20 bg-[var(--green-950)]/30 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[var(--green-400)] text-2xl">✓</span>
              <div>
                <h2 className="text-lg font-bold text-[var(--green-400)]">Outcome Resolved</h2>
                <p className="text-sm text-[var(--text-secondary)]">Goal achieved successfully</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{caseData.resolution.initialRisk}%</div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase">Initial risk</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--green-400)]">{caseData.resolution.finalRisk}%</div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase">Final risk</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">Rs.{caseData.resolution.cost.toLocaleString()}</div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase">Cost</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{caseData.resolution.replans}</div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase">Replans</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{caseData.resolution.humanInterventions}</div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase">Human decisions</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--green-500)]/10">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">What ResolveOS did</div>
              <div className="space-y-1">
                {caseData.resolution.actions.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-[var(--green-40)]">
                    <span className="text-[var(--green-400)]">✓</span> {a}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Decision Required */}
        {pendingDecision && (
          <Card className="p-6 border-2 border-[var(--red-500)]/30 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-3 h-3 rounded-full bg-[var(--red-500)] animate-pulse-subtle" />
              <div>
                <h3 className="font-bold text-[var(--red-400)] uppercase tracking-wider text-sm">Decision Required</h3>
                <p className="text-xs text-[var(--text-secondary)]">Human approval needed to proceed</p>
              </div>
            </div>
            <div className="mb-4">
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Action</div>
              <div className="text-lg font-semibold">{pendingDecision.description}</div>
            </div>
            {pendingDecision.cost && (
              <div className="mb-4">
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Cost</div>
                <div className="text-2xl font-bold font-mono">Rs.{pendingDecision.cost.toLocaleString()}</div>
              </div>
            )}
            <div className="mb-4">
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Reason</div>
              <div className="text-sm text-[var(--text-secondary)]">{pendingDecision.reason}</div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => showToast("Rejected", "error")} className="flex-1">Reject</Button>
              <Button variant="success" onClick={() => handleApprove(pendingDecision.id)} className="flex-1">Approve & Execute</Button>
            </div>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Goal */}
            <Card className="p-5">
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Goal</div>
              <p className="text-sm leading-relaxed">{caseData.goal}</p>
            </Card>

            {/* Risk Factors */}
            <Card className="p-5">
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">Risk Factors</div>
              <div className="space-y-2">
                {caseData.riskFactors.map((rf, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">{rf.label}</span>
                    <Badge variant={rf.level === "high" ? "red" : rf.level === "medium" ? "amber" : "green"}>
                      {rf.level}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Autonomy Budget */}
            <Card className="p-5">
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">Autonomy Budget</div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--text-tertiary)]">Spend</span>
                    <span className="font-mono text-xs">Rs.{caseData.autonomyBudget.spent.toLocaleString()} / Rs.{caseData.autonomyBudget.maxSpend.toLocaleString()}</span>
                  </div>
                  <Progress value={caseData.autonomyBudget.spent} max={caseData.autonomyBudget.maxSpend} color="blue" size="sm" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--text-tertiary)]">Actions</span>
                    <span className="font-mono text-xs">{caseData.autonomyBudget.actionsUsed} / {caseData.autonomyBudget.maxActions}</span>
                  </div>
                  <Progress value={caseData.autonomyBudget.actionsUsed} max={caseData.autonomyBudget.maxActions} color="blue" size="sm" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--text-tertiary)]">Replans</span>
                    <span className="font-mono text-xs">{caseData.replanCount} / {caseData.maxReplans}</span>
                  </div>
                  <Progress value={caseData.replanCount} max={caseData.maxReplans} color={caseData.replanCount > 1 ? "amber" : "blue"} size="sm" />
                </div>
              </div>
            </Card>

            {/* Supplier Alternatives (when investigating) */}
            {alternatives.length > 0 && (caseData.status === "investigating" || caseData.status === "decision_required" || resolved) && (
              <Card className="p-5">
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">Supplier Options</div>
                <div className="space-y-2">
                  {alternatives.map((alt, i) => (
                    <div key={alt.supplierId} className={`p-3 rounded-[var(--radius-md)] border ${i === 0 ? "border-[var(--green-500)]/30 bg-[var(--green-950)]/20" : "border-[var(--border-subtle)]"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{alt.supplierName}</span>
                        {i === 0 && <Badge variant="green">Recommended</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
                        <span className="font-mono">Rs.{alt.price}/unit</span>
                        <span>{alt.deliveryDays} days</span>
                        <span>{Math.round(alt.reliability * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Plan */}
            {caseData.plans.length > 0 && (
              <Card className="overflow-hidden">
                <div className="px-5 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    {caseData.plans.length > 1 ? `Plan ${caseData.plans.length} (Replan #${caseData.replanCount})` : "Current Plan"}
                  </h3>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    {caseData.plans[caseData.currentPlanIndex]?.steps.filter(s => s.status === "completed").length || 0}/{caseData.plans[caseData.currentPlanIndex]?.steps.length || 0}
                  </span>
                </div>
                <div className="h-1 bg-[var(--bg-tertiary)]">
                  <div className="h-1 bg-[var(--blue-500)] transition-all duration-700"
                    style={{ width: `${caseData.plans[caseData.currentPlanIndex] ? (caseData.plans[caseData.currentPlanIndex].steps.filter(s => s.status === "completed").length / caseData.plans[caseData.currentPlanIndex].steps.length) * 100 : 0}%` }} />
                </div>
                <div className="p-5 space-y-1">
                  {caseData.plans[caseData.currentPlanIndex]?.steps.map(step => (
                    <div key={step.id} className={`flex items-center gap-3 py-2 px-2 rounded-md ${step.status === "executing" ? "bg-[var(--blue-500)]/5" : ""}`}>
                      <span className={`text-sm w-5 text-center ${
                        step.status === "completed" ? "text-[var(--green-400)]" :
                        step.status === "executing" ? "text-[var(--blue-400)]" :
                        step.status === "failed" ? "text-[var(--red-400)]" :
                        "text-[var(--text-muted)]"
                      }`}>
                        {step.status === "completed" ? "✓" : step.status === "executing" ? "◉" : "○"}
                      </span>
                      <span className={`text-sm flex-1 ${step.status === "completed" ? "text-[var(--text-secondary)]" : step.status === "executing" ? "font-medium" : "text-[var(--text-muted)]"}`}>
                        {step.description}
                      </span>
                      {step.requiresApproval && <Badge variant="amber" className="text-[9px]">approval</Badge>}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Agent Activity */}
            <Card className="overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Agent Activity</h3>
                <span className="text-xs text-[var(--text-muted)] font-mono">{caseData.events.length} events</span>
              </div>
              <div ref={eventsRef} className="max-h-[400px] overflow-y-auto">
                {caseData.events.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[var(--text-muted)]">Waiting for agent activity...</div>
                ) : (
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {caseData.events.map(evt => {
                      const ts = evt.timestamp.length > 19 ? evt.timestamp.substring(11, 19) : "?";
                      const isImportant = evt.type.includes("DECISION") || evt.type.includes("REPLAN") || evt.type.includes("INVALIDATED") || evt.type.includes("RESOLVED") || evt.type.includes("FAILED");
                      const isSuccess = evt.type.includes("COMPLETED") || evt.type.includes("GRANTED") || evt.type.includes("PASSED") || evt.type.includes("RESOLVED");
                      const isError = evt.type.includes("FAILED") || evt.type.includes("REJECTED");
                      const showWhy = ["TOOL_COMPLETED", "DECISION_REQUIRED", "RISK_UPDATED", "PLAN_INVALIDATED"].includes(evt.type);

                      return (
                        <div key={evt.id} className={`px-5 py-3 flex items-start gap-3 hover:bg-[var(--bg-tertiary)]/30 transition-colors ${isImportant ? "bg-[var(--amber-500)]/5" : ""}`}>
                          <span className="text-xs text-[var(--text-muted)] font-mono mt-0.5 shrink-0 w-14">{ts}</span>
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            isSuccess ? "bg-[var(--green-500)]" :
                            isError ? "bg-[var(--red-500)]" :
                            isImportant ? "bg-[var(--amber-500)] animate-pulse-subtle" :
                            "bg-[var(--border-subtle)]"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm ${isSuccess ? "text-[var(--green-400)]" : isError ? "text-[var(--red-400)]" : "text-[var(--text-secondary)]"}`}>
                              {humanizeEvent(evt)}
                            </div>
                            {showWhy && (
                              <button
                                onClick={() => setShowWhy(showWhy === showWhy ? null : evt.id)}
                                className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] mt-1 transition-colors"
                              >
                                {showWhy ? "Hide details" : "Why?"}
                              </button>
                            )}
                            {showWhy && evt.details && (
                              <div className="mt-2 text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded p-2 font-mono">
                                {typeof evt.details === "string" ? evt.details : JSON.stringify(evt.details, null, 2)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function humanizeEvent(evt: CaseEvent): string {
  const msg = evt.message;
  if (msg.includes("Stockout risk")) return "Stockout risk detected: 87%";
  if (msg.includes("Inventory retrieved")) return "Inventory checked: 120 units in stock";
  if (msg.includes("Purchase order created")) return "Purchase order created";
  if (msg.includes("Approval required")) return "Approval required — exceeds autonomous limit";
  if (msg.includes("Approval received")) return "Approval received — executing";
  if (msg.includes("Outcome resolved")) return "Outcome resolved successfully";
  if (msg.includes("Plan invalidated")) return "Plan invalidated — new information";
  if (msg.includes("Replan")) return "Generating new approach";
  if (msg.includes("MONITORING")) return "Monitoring activated";
  if (msg.includes("CASE_CREATED")) return "Case created";
  if (msg.includes("CONTRACT_CREATED")) return "Outcome contract established";
  if (msg.includes("COMPARISON")) return "Supplier options compared";
  if (msg.includes("EXTERNAL_EVENT")) return "External event received";
  if (msg.includes("VERIFICATION")) return "Verification complete";
  return msg;
}
