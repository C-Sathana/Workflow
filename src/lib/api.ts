const BASE = "/api";

function getToken() {
  return localStorage.getItem("wf_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const e = await res.json(); msg = e.message || msg; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return {} as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export type Workflow = {
  id: string; name: string; description?: string; status: string;
  version: number; createdAt: string; updatedAt: string; stepCount?: number;
  inputSchema?: Record<string, any>; startStepId?: string; steps?: Step[];
};
export type Step = {
  id: string; workflowId: string; name: string; stepType: string;
  order: number; metadata?: Record<string, any>; rules?: Rule[];
};
export type Rule = {
  id: string; stepId: string; condition: string;
  nextStepId?: string | null; priority: number;
};
export type Execution = {
  id: string; workflowId: string; status: string; currentStepId?: string;
  inputData?: Record<string, any>; logs?: any[]; createdAt: string; updatedAt: string;
  workflowName?: string;
};
export type Approval = {
  id: string; executionId: string; stepId: string; approverId?: string;
  status: string; comment?: string; createdAt: string; updatedAt: string;
  stepName?: string; workflowName?: string; requestedBy?: string;
};
export type Template = {
  id: string; name: string; description?: string; category: string;
  icon?: string; inputSchema?: Record<string, any>; stepsConfig?: any[];
};
export type AnalyticsData = {
  totalWorkflows: number; totalExecutions: number; pendingApprovals: number;
  successRate: number; avgDuration: number; executionsByStatus: Record<string, number>;
  recentExecutions: any[]; topWorkflows: any[];
};
