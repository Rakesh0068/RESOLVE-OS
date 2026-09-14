// API client for ResolveOS backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// Cases
export async function listCases(status?: string) {
  const params = status ? `?status=${status}` : "";
  return fetchAPI<{ cases: any[]; count: number }>(`/api/cases${params}`);
}

export async function getCase(caseId: string) {
  return fetchAPI<any>(`/api/cases/${caseId}`);
}

export async function createCase(goal: string) {
  return fetchAPI<any>("/api/cases", {
    method: "POST",
    body: JSON.stringify({ goal }),
  });
}

export async function runCase(caseId: string) {
  return fetchAPI<any>(`/api/cases/${caseId}/run`, { method: "POST" });
}

// Approvals
export async function listApprovals() {
  return fetchAPI<{ approvals: any[]; count: number }>("/api/approvals");
}

export async function approveAction(caseId: string) {
  return fetchAPI<any>(`/api/cases/${caseId}/approve`, { method: "POST" });
}

export async function rejectAction(caseId: string) {
  return fetchAPI<any>(`/api/cases/${caseId}/reject`, { method: "POST" });
}

// Stats
export async function getStats() {
  return fetchAPI<any>("/api/stats");
}
