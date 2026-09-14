// Types matching the ResolveOS backend models

export interface Case {
  id: string;
  title: string;
  goal: string;
  status: CaseStatus;
  risk_level: number;
  outcome_contract: OutcomeContract | null;
  current_plan: PlanStep[];
  plan_history: PlanStep[][];
  actions_taken: any[];
  replan_count: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  activity_log: ActivityEvent[];
  pending_approvals: PendingApproval[];
  plan_progress?: string;
}

export type CaseStatus =
  | "open"
  | "investigating"
  | "planning"
  | "awaiting_approval"
  | "executing"
  | "monitoring"
  | "resolved"
  | "escalated";

export interface PlanStep {
  id: string;
  description: string;
  tool_name: string;
  params: Record<string, any>;
  step_type: string;
  status: "pending" | "executing" | "completed" | "failed" | "skipped";
  requires_approval: boolean;
  result: any | null;
}

export interface OutcomeContract {
  goal: string;
  constraints: string[];
  success_criteria: string;
  escalation_rules: string[];
  budget: string;
  max_replans: number;
  deadline: string;
  risk_threshold: string;
}

export interface ActivityEvent {
  id?: string;
  case_id?: string;
  timestamp: string;
  message: string;
  step_type: string;
  details?: any;
}

export interface PendingApproval {
  id: string;
  case_id: string;
  action_type: string;
  action_details: Record<string, any>;
  reason: string;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  resolved_at: string | null;
}

export interface DashboardStats {
  total_cases: number;
  resolved: number;
  monitoring: number;
  needs_decision: number;
  active: number;
}

export interface WSMessage {
  type: "activity" | "approval_required" | "case_updated" | "simulation_event" | "escalation" | "history" | "pong";
  case_id?: string;
  data: any;
}
