// ── Case Store ──────────────────────────────────────────
// Manages case state, agent lifecycle, and deterministic demo flow.

import { PRODUCTS, SUPPLIERS, PURCHASE_ORDERS, getSupplierAlternatives, calculateInventoryRisk } from "@/data/demo";
import type { Case, CaseEvent, CasePlan, CaseDecision, CaseStatus } from "@/data/demo";

let _caseIdCounter = 1000;
let _eventIdCounter = 0;
let _decisionIdCounter = 0;

function nextCaseId() { return `CASE-${++_caseIdCounter}`; }
function nextEventId() { return `EVT-${++_eventIdCounter}`; }
function nextDecisionId() { return `DEC-${++_decisionIdCounter}`; }

function now() { return new Date().toISOString(); }

function addEvent(caseData: Case, type: string, message: string, details?: any): CaseEvent {
  const evt: CaseEvent = { id: nextEventId(), caseId: caseData.id, timestamp: now(), type, message, details };
  caseData.events.push(evt);
  return evt;
}

// ── Case Store (in-memory) ─────────────────────────────

const cases = new Map<string, Case>();
const caseListeners = new Set<(cases: Case[]) => void>();

function notifyListeners() {
  const list = Array.from(cases.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  caseListeners.forEach(fn => fn(list));
}

export function subscribeCases(fn: (cases: Case[]) => void) {
  caseListeners.add(fn);
  return () => caseListeners.delete(fn);
}

export function getAllCases(): Case[] {
  return Array.from(cases.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getCase(id: string): Case | undefined {
  return cases.get(id);
}

export function getDecisions(): CaseDecision[] {
  const all: CaseDecision[] = [];
  cases.forEach(c => all.push(...c.decisions));
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getPendingDecisions(): CaseDecision[] {
  return getDecisions().filter(d => d.status === "pending");
}

export function getStats() {
  const all = getAllCases();
  return {
    total: all.length,
    active: all.filter(c => !["resolved", "failed"].includes(c.status)).length,
    resolved: all.filter(c => c.status === "resolved").length,
    monitoring: all.filter(c => c.status === "monitoring").length,
    needsDecision: all.filter(c => c.status === "decision_required").length,
    failed: all.filter(c => c.status === "failed").length,
    escalated: all.filter(c => c.status === "escalated").length,
  };
}

// ── Create Case ─────────────────────────────────────────

export function createCase(goal: string): Case {
  const id = nextCaseId();
  const product = PRODUCTS[0]; // Default to tea leaves for demo
  const risk = calculateInventoryRisk(product);

  const caseData: Case = {
    id,
    title: generateTitle(goal),
    goal,
    status: "created",
    riskScore: risk,
    riskFactors: [
      { label: "Inventory pressure", level: risk > 60 ? "high" : risk > 30 ? "medium" : "low" },
      { label: "Supplier reliability", level: "medium" },
      { label: "Deadline proximity", level: "medium" },
    ],
    deadline: "Friday 10:00 AM",
    createdAt: now(),
    updatedAt: now(),
    events: [],
    plans: [],
    currentPlanIndex: 0,
    decisions: [],
    replanCount: 0,
    maxReplans: 3,
    autonomyBudget: {
      maxSpend: 50000,
      spent: 0,
      maxActions: 15,
      actionsUsed: 0,
      maxReplans: 3,
      replansUsed: 0,
    },
  };

  addEvent(caseData, "CASE_CREATED", "Case created");
  cases.set(id, caseData);
  notifyListeners();
  return caseData;
}

function generateTitle(goal: string): string {
  const lower = goal.toLowerCase();
  if (lower.includes("supplier") || lower.includes("delivery") || lower.includes("stock") || lower.includes("late")) {
    return "Prevent inventory shortage";
  }
  if (lower.includes("invoice") || lower.includes("bill") || lower.includes("discrepancy")) {
    return "Resolve invoice discrepancy";
  }
  if (lower.includes("customer") || lower.includes("complaint") || lower.includes("refund")) {
    return "Handle customer complaint";
  }
  return goal.length > 50 ? goal.substring(0, 47) + "..." : goal;
}

// ── Run Agent (deterministic simulation) ────────────────

export async function runCase(caseId: string): Promise<void> {
  const c = cases.get(caseId);
  if (!c) return;

  const lower = c.goal.toLowerCase();
  const isSupplier = lower.includes("supplier") || lower.includes("delivery") || lower.includes("stock") || lower.includes("late");

  if (isSupplier) {
    await runSupplierScenario(c);
  } else if (lower.includes("invoice")) {
    await runInvoiceScenario(c);
  } else {
    await runGenericScenario(c);
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSupplierScenario(c: Case) {
  const product = PRODUCTS[0]; // Tea leaves

  // Phase 1: Understand
  updateStatus(c, "understanding");
  addEvent(c, "UNDERSTANDING", "Understanding the objective...");
  await delay(800);
  addEvent(c, "CONTRACT_CREATED", "Outcome contract created", {
    goal: "Prevent inventory shortage",
    success: "Inventory stays above minimum level",
    budget: "Rs.50,000",
  });
  await delay(600);

  // Phase 2: Plan
  updateStatus(c, "planning");
  addEvent(c, "PLAN_CREATED", "Generating execution plan...");
  await delay(600);

  const plan1: CasePlan = {
    id: "PLAN-1",
    name: "Primary plan",
    steps: [
      { id: "s1", description: "Check current inventory levels", tool: "get_inventory", status: "pending" },
      { id: "s2", description: "Check existing purchase orders", tool: "get_purchase_order", status: "pending" },
      { id: "s3", description: "Calculate projected shortage", tool: "reason", status: "pending" },
      { id: "s4", description: "Check supplier history", tool: "get_supplier_history", status: "pending" },
      { id: "s5", description: "Search alternative suppliers", tool: "search_suppliers", status: "pending" },
      { id: "s6", description: "Compare supplier options", tool: "compare_options", status: "pending" },
      { id: "s7", description: "Request approval for emergency purchase", tool: "request_approval", status: "pending", requiresApproval: true },
      { id: "s8", description: "Create purchase order", tool: "create_purchase_order", status: "pending" },
      { id: "s9", description: "Send supplier notification", tool: "send_email", status: "pending" },
      { id: "s10", description: "Verify order confirmation", tool: "verify_order", status: "pending" },
      { id: "s11", description: "Check updated inventory", tool: "check_inventory", status: "pending" },
    ],
  };
  c.plans.push(plan1);
  await delay(400);

  // Phase 3: Investigate
  updateStatus(c, "investigating");
  await executeStep(c, 0, 0, "Inventory retrieved: 120 units (min: 50, daily usage: 8)");
  await executeStep(c, 0, 1, "Found 3 active purchase orders");
  await executeStep(c, 0, 2, "Projected stockout: 5 days (120 units / 8 per day = 15 days supply, but delivery in 5 days creates 40-unit gap)");
  c.riskScore = 87;
  c.riskFactors = [
    { label: "Inventory pressure", level: "high" },
    { label: "Supplier delayed", level: "high" },
    { label: "Deadline proximity", level: "medium" },
  ];
  addEvent(c, "RISK_UPDATED", "Stockout risk detected: 87%", { risk: 87 });
  notifyListeners();
  await delay(600);

  await executeStep(c, 0, 3, "Chai Point Supplies: 85% reliability, avg 3 days");
  await executeStep(c, 0, 4, "Found 4 alternative suppliers for Premium Tea Leaves");

  // Show comparison
  const alternatives = getSupplierAlternatives("PROD-001");
  addEvent(c, "COMPARISON", "Supplier comparison complete", { alternatives });
  await delay(600);

  await executeStep(c, 0, 5, "Recommendation: QuickMart Local (2 days, Rs.510/unit) — fastest delivery before projected stockout");

  // Phase 4: Decision Required
  updateStatus(c, "decision_required");
  const decision: CaseDecision = {
    id: nextDecisionId(),
    caseId: c.id,
    actionType: "purchase_order",
    description: "Purchase 100 units from QuickMart Local",
    cost: 51000,
    reason: "Original supplier delayed. QuickMart Local can deliver in 2 days, preventing projected stockout. Cost: Rs.51,000 for 100 units at Rs.510/unit.",
    status: "pending",
    createdAt: now(),
  };
  c.decisions.push(decision);
  addEvent(c, "DECISION_REQUIRED", "Approval required: Rs.51,000 purchase exceeds autonomous limit", { decisionId: decision.id });
  notifyListeners();
  await delay(400);
}

async function executeStep(c: Case, planIdx: number, stepIdx: number, result: string) {
  const plan = c.plans[planIdx];
  if (!plan) return;
  const step = plan.steps[stepIdx];
  if (!step) return;

  step.status = "executing";
  addEvent(c, "TOOL_STARTED", step.description);
  notifyListeners();
  await delay(400 + Math.random() * 400);

  step.status = "completed";
  step.result = result;
  addEvent(c, "TOOL_COMPLETED", result);
  c.autonomyBudget.actionsUsed++;
  notifyListeners();
  await delay(200);
}

function updateStatus(c: Case, status: CaseStatus) {
  c.status = status;
  c.updatedAt = now();
  notifyListeners();
}

// ── Approve Decision ────────────────────────────────────

export async function approveDecision(decisionId: string): Promise<void> {
  let targetCase: Case | undefined;
  let decision: CaseDecision | undefined;

  for (const c of cases.values()) {
    const d = c.decisions.find(d => d.id === decisionId);
    if (d) { targetCase = c; decision = d; break; }
  }
  if (!targetCase || !decision) return;

  decision.status = "approved";
  addEvent(targetCase, "APPROVAL_GRANTED", "Approval received — executing plan");
  targetCase.autonomyBudget.spent += decision.cost || 0;

  // Continue execution
  await continueAfterApproval(targetCase, decision);
}

async function continueAfterApproval(c: Case, decision: CaseDecision) {
  // If this is an emergency/second decision, resolve directly
  if (decision.actionType === "emergency_purchase" || c.replanCount > 0) {
    updateStatus(c, "executing");
    await executeStep(c, c.currentPlanIndex, 4, "Emergency purchase order created: PO-EMERG-001");
    await executeStep(c, c.currentPlanIndex, 5, "Order confirmed — 4-hour delivery scheduled");

    // Verify
    updateStatus(c, "verifying");
    addEvent(c, "VERIFICATION_STARTED", "Verifying outcome...");
    await delay(800);
    addEvent(c, "VERIFICATION_PASSED", "Inventory safe: 170 units projected (above minimum 50)");

    // Resolve
    c.status = "resolved";
    c.resolvedAt = now();
    c.riskScore = 6;
    c.resolution = {
      initialRisk: 87,
      finalRisk: 6,
      cost: c.decisions.reduce((sum, d) => sum + (d.status === "approved" ? (d.cost || 0) : 0), 0),
      replans: c.replanCount,
      humanInterventions: c.decisions.filter(d => d.status === "approved").length,
      actions: [
        "Identified projected stockout",
        "Investigated supplier options",
        "Compared alternatives",
        "Requested approval",
        "Placed emergency order",
        "Verified delivery",
        "Outcome resolved",
      ],
    };
    addEvent(c, "CASE_RESOLVED", "Outcome resolved successfully");
    notifyListeners();
    return;
  }

  // Execute remaining steps
  updateStatus(c, "executing");
  await executeStep(c, 0, 7, `Purchase order created: PO-${1300 + Math.floor(Math.random() * 100)}`);
  await executeStep(c, 0, 8, "Supplier notified via email");
  await executeStep(c, 0, 9, "Order confirmed by supplier");
  await executeStep(c, 0, 10, "Inventory projection updated: 220 units expected");

  // Monitoring
  updateStatus(c, "monitoring");
  addEvent(c, "MONITORING_STARTED", "Monitoring delivery — next check in 2 hours");
  notifyListeners();
  await delay(2000);

  // Simulate supplier delay (replan trigger)
  addEvent(c, "EXTERNAL_EVENT", "Supplier B reports delivery delay: +1 day");
  c.riskScore = 87;
  addEvent(c, "PLAN_INVALIDATED", "Current plan invalidated: supplier delivery changed", {
    previous: "Delivery tomorrow",
    new: "Delivery in 2 days",
  });

  // Replan
  c.replanCount++;
  c.autonomyBudget.replansUsed++;
  updateStatus(c, "replanning");
  addEvent(c, "REPLAN_STARTED", `Replan #${c.replanCount}: Evaluating alternatives...`);
  await delay(800);

  const plan2: CasePlan = {
    id: "PLAN-2",
    name: "Emergency plan",
    steps: [
      { id: "r1", description: "Recalculate shortage with new timeline", tool: "reason", status: "pending" },
      { id: "r2", description: "Search emergency local suppliers", tool: "search_suppliers", status: "pending" },
      { id: "r3", description: "Compare emergency options", tool: "compare_options", status: "pending" },
      { id: "r4", description: "Request approval for emergency order", tool: "request_approval", status: "pending", requiresApproval: true },
      { id: "r5", description: "Create emergency purchase order", tool: "create_purchase_order", status: "pending" },
      { id: "r6", description: "Verify emergency order", tool: "verify_order", status: "pending" },
    ],
  };
  c.plans.push(plan2);
  c.currentPlanIndex = 1;

  await executeStep(c, 1, 0, "Shortage confirmed: 80 units needed within 24 hours");
  await executeStep(c, 1, 1, "Found QuickMart Local: 4-hour delivery available");
  await executeStep(c, 1, 2, "Emergency option: 50 units at Rs.510/unit = Rs.25,500 (4-hour delivery)");

  // Decision required for emergency
  updateStatus(c, "decision_required");
  const emergencyDecision: CaseDecision = {
    id: nextDecisionId(),
    caseId: c.id,
    actionType: "emergency_purchase",
    description: "Emergency purchase: 50 units from QuickMart Local",
    cost: 25500,
    reason: "Original supplier delayed further. Emergency local supplier can deliver in 4 hours. Cost: Rs.25,500.",
    status: "pending",
    createdAt: now(),
  };
  c.decisions.push(emergencyDecision);
  addEvent(c, "DECISION_REQUIRED", "Emergency approval required: Rs.25,500", { decisionId: emergencyDecision.id });
  notifyListeners();
}

// ── Continue after emergency approval ───────────────────

export async function approveEmergencyDecision(decisionId: string): Promise<void> {
  let targetCase: Case | undefined;
  let decision: CaseDecision | undefined;

  for (const c of cases.values()) {
    const d = c.decisions.find(d => d.id === decisionId);
    if (d) { targetCase = c; decision = d; break; }
  }
  if (!targetCase || !decision) return;

  decision.status = "approved";
  targetCase.autonomyBudget.spent += decision.cost || 0;
  addEvent(targetCase, "APPROVAL_GRANTED", "Emergency approval received");
  updateStatus(targetCase, "executing");

  await executeStep(targetCase, 1, 4, "Emergency purchase order created: PO-EMERG-001");
  await executeStep(targetCase, 1, 5, "Order confirmed — 4-hour delivery scheduled");

  // Verify
  updateStatus(targetCase, "verifying");
  addEvent(targetCase, "VERIFICATION_STARTED", "Verifying outcome...");
  await delay(800);
  addEvent(targetCase, "VERIFICATION_PASSED", "Inventory safe: 170 units projected (above minimum 50)");

  // Resolve
  targetCase.status = "resolved";
  targetCase.resolvedAt = now();
  targetCase.riskScore = 6;
  targetCase.resolution = {
    initialRisk: 87,
    finalRisk: 6,
    cost: decision.cost || 0,
    replans: targetCase.replanCount,
    humanInterventions: targetCase.decisions.filter(d => d.status === "approved").length,
    actions: [
      "Identified projected stockout",
      "Investigated supplier options",
      "Compared alternatives",
      "Requested approval",
      "Placed emergency order",
      "Verified delivery",
      "Outcome resolved",
    ],
  };
  addEvent(targetCase, "CASE_RESOLVED", "Outcome resolved successfully");
  notifyListeners();
}

async function runInvoiceScenario(c: Case) {
  updateStatus(c, "understanding");
  addEvent(c, "UNDERSTANDING", "Analyzing invoice discrepancy...");
  await delay(800);
  addEvent(c, "CONTRACT_CREATED", "Outcome contract created", { goal: "Resolve invoice discrepancy" });
  await delay(600);

  updateStatus(c, "investigating");
  const plan: CasePlan = {
    id: "PLAN-1", name: "Invoice investigation",
    steps: [
      { id: "i1", description: "Extract invoice fields", tool: "parse_document", status: "pending" },
      { id: "i2", description: "Retrieve purchase order", tool: "get_purchase_order", status: "pending" },
      { id: "i3", description: "Compare amounts", tool: "reason", status: "pending" },
      { id: "i4", description: "Check historical invoices", tool: "get_supplier_history", status: "pending" },
      { id: "i5", description: "Contact supplier", tool: "send_email", status: "pending" },
      { id: "i6", description: "Verify correction", tool: "verify_order", status: "pending" },
    ],
  };
  c.plans.push(plan);

  await executeStep(c, 0, 0, "Invoice extracted: INV-3821, Rs.84,500 from Chai Point Supplies");
  await executeStep(c, 0, 1, "PO retrieved: PO-1294, Rs.72,500");
  await executeStep(c, 0, 2, "Discrepancy detected: Rs.12,000 difference (16.6% over PO)");
  c.riskScore = 65;
  addEvent(c, "RISK_UPDATED", "Invoice discrepancy: Rs.12,000 over PO amount", { difference: 12000 });
  notifyListeners();
  await delay(600);

  await executeStep(c, 0, 3, "Historical check: 2 prior invoices matched PO amounts");
  await executeStep(c, 0, 4, "Supplier contacted about discrepancy");

  updateStatus(c, "decision_required");
  const decision: CaseDecision = {
    id: nextDecisionId(), caseId: c.id, actionType: "invoice_resolution",
    description: "Approve corrected invoice of Rs.72,500",
    cost: 72500, reason: "Supplier acknowledged pricing error. Corrected invoice matches PO.",
    status: "pending", createdAt: now(),
  };
  c.decisions.push(decision);
  addEvent(c, "DECISION_REQUIRED", "Approval required for corrected invoice", { decisionId: decision.id });
  notifyListeners();
}

async function runGenericScenario(c: Case) {
  updateStatus(c, "understanding");
  addEvent(c, "UNDERSTANDING", "Understanding the objective...");
  await delay(800);
  addEvent(c, "CONTRACT_CREATED", "Outcome contract created");
  await delay(600);

  updateStatus(c, "investigating");
  addEvent(c, "TOOL_STARTED", "Gathering information...");
  await delay(1000);
  addEvent(c, "TOOL_COMPLETED", "Information gathered");

  updateStatus(c, "decision_required");
  const decision: CaseDecision = {
    id: nextDecisionId(), caseId: c.id, actionType: "general_action",
    description: "Execute recommended action", reason: "Action requires approval per business policy.",
    status: "pending", createdAt: now(),
  };
  c.decisions.push(decision);
  addEvent(c, "DECISION_REQUIRED", "Approval required", { decisionId: decision.id });
  notifyListeners();
}

// ── Initialize with pre-existing resolved case ──────────

export function initializeDemoData() {
  // Create a pre-resolved case for the dashboard
  const resolvedCase: Case = {
    id: "CASE-1001",
    title: "Prevent inventory shortage",
    goal: "The supplier says our tea leaves delivery will be late by 3 days. Make sure we dont run out of stock.",
    status: "resolved",
    riskScore: 6,
    riskFactors: [
      { label: "Inventory pressure", level: "low" },
      { label: "Supplier reliability", level: "low" },
    ],
    deadline: "Friday 10:00 AM",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    resolvedAt: new Date(Date.now() - 1800000).toISOString(),
    events: [
      { id: "EVT-100", caseId: "CASE-1001", timestamp: new Date(Date.now() - 3600000).toISOString(), type: "CASE_CREATED", message: "Case created" },
      { id: "EVT-101", caseId: "CASE-1001", timestamp: new Date(Date.now() - 3500000).toISOString(), type: "UNDERSTANDING", message: "Understanding the objective..." },
      { id: "EVT-102", caseId: "CASE-1001", timestamp: new Date(Date.now() - 3400000).toISOString(), type: "TOOL_COMPLETED", message: "Inventory retrieved: 120 units" },
      { id: "EVT-103", caseId: "CASE-1001", timestamp: new Date(Date.now() - 3200000).toISOString(), type: "RISK_UPDATED", message: "Stockout risk: 87%" },
      { id: "EVT-104", caseId: "CASE-1001", timestamp: new Date(Date.now() - 3000000).toISOString(), type: "DECISION_REQUIRED", message: "Approval required: Rs.51,000" },
      { id: "EVT-105", caseId: "CASE-1001", timestamp: new Date(Date.now() - 2800000).toISOString(), type: "APPROVAL_GRANTED", message: "Approval received" },
      { id: "EVT-106", caseId: "CASE-1001", timestamp: new Date(Date.now() - 2600000).toISOString(), type: "TOOL_COMPLETED", message: "Purchase order created" },
      { id: "EVT-107", caseId: "CASE-1001", timestamp: new Date(Date.now() - 2200000).toISOString(), type: "CASE_RESOLVED", message: "Outcome resolved successfully" },
    ],
    plans: [{
      id: "PLAN-100", name: "Primary plan",
      steps: [
        { id: "s1", description: "Check inventory", tool: "get_inventory", status: "completed", result: "120 units" },
        { id: "s2", description: "Search alternatives", tool: "search_suppliers", status: "completed", result: "4 suppliers found" },
        { id: "s3", description: "Request approval", tool: "request_approval", status: "completed", requiresApproval: true },
        { id: "s4", description: "Create purchase order", tool: "create_purchase_order", status: "completed", result: "PO created" },
        { id: "s5", description: "Verify outcome", tool: "verify_order", status: "completed", result: "Verified" },
      ],
    }],
    currentPlanIndex: 0,
    decisions: [{
      id: "DEC-100", caseId: "CASE-1001", actionType: "purchase_order",
      description: "Purchase 100 units from QuickMart Local", cost: 51000,
      reason: "Prevent projected stockout", status: "approved",
      createdAt: new Date(Date.now() - 3000000).toISOString(),
    }],
    replanCount: 0,
    maxReplans: 3,
    autonomyBudget: { maxSpend: 50000, spent: 51000, maxActions: 15, actionsUsed: 5, maxReplans: 3, replansUsed: 0 },
    resolution: { initialRisk: 87, finalRisk: 6, cost: 51000, replans: 0, humanInterventions: 1, actions: ["Identified stockout", "Investigated suppliers", "Compared options", "Requested approval", "Placed order", "Verified outcome"] },
  };
  cases.set(resolvedCase.id, resolvedCase);
}
