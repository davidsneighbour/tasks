import type { LabelColour, LabelIconName } from "@shared/labels";
import type { StarType } from "@shared/stars";
import type { LabelDTO, StatusResponse, TaskDTO, TaskListDTO } from "@shared/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const requestInit: RequestInit = { ...init };
  if (init?.body) {
    requestInit.headers = { "Content-Type": "application/json", ...init.headers };
  }

  const response = await fetch(path, requestInit);

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Request to ${path} failed with status ${response.status}.`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getStatus(): Promise<StatusResponse> {
  return request<StatusResponse>("/api/status");
}

export type SyncResult =
  | { status: "success"; listsAdded: number; listsUpdated: number; listsRemoved: number; tasksAdded: number; tasksUpdated: number; tasksRemoved: number }
  | { status: "error"; message: string };

// Runs the same reconciliation routine as startup (plan.md section 27) - no separate
// manual-sync implementation on the server.
export function syncNow(): Promise<SyncResult> {
  return request("/api/sync", { method: "POST" });
}

export function getTaskLists(): Promise<{ taskLists: TaskListDTO[]; defaultTaskListGtId: string | null }> {
  return request("/api/task-lists");
}

export function setTaskListOrder(gtIds: string[]): Promise<{ ok: true }> {
  return request("/api/task-lists/order", { method: "PUT", body: JSON.stringify({ gtIds }) });
}

export function setDefaultTaskList(gtId: string | null): Promise<{ ok: true }> {
  return request("/api/task-lists/default", { method: "PUT", body: JSON.stringify({ gtId }) });
}

export function getTaskCounts(
  params: { deadTasksThresholdDays?: number } = {},
): Promise<{ views: Record<string, number>; lists: Record<string, number> }> {
  const search = new URLSearchParams();
  if (params.deadTasksThresholdDays !== undefined) search.set("deadTasksThresholdDays", String(params.deadTasksThresholdDays));
  const query = search.toString();
  return request(`/api/tasks/counts${query ? `?${query}` : ""}`);
}

export function getTasks(
  params: { view?: string; list?: string; label?: number; star?: StarType; thresholdDays?: number } = {},
): Promise<{ tasks: TaskDTO[] }> {
  const search = new URLSearchParams();
  if (params.view) search.set("view", params.view);
  if (params.list) search.set("list", params.list);
  if (params.label !== undefined) search.set("label", String(params.label));
  if (params.star) search.set("star", params.star);
  if (params.thresholdDays !== undefined) search.set("thresholdDays", String(params.thresholdDays));
  const query = search.toString();
  return request(`/api/tasks${query ? `?${query}` : ""}`);
}

export interface CreateTaskInput {
  taskListGtId: string;
  title: string;
  notes?: string;
  due?: string;
}

export function createTask(input: CreateTaskInput): Promise<{ task: TaskDTO }> {
  return request("/api/tasks", { method: "POST", body: JSON.stringify(input) });
}

export function completeTask(gtId: string): Promise<{ task: TaskDTO }> {
  return request(`/api/tasks/${encodeURIComponent(gtId)}/complete`, { method: "POST" });
}

export function reopenTask(gtId: string): Promise<{ task: TaskDTO }> {
  return request(`/api/tasks/${encodeURIComponent(gtId)}/reopen`, { method: "POST" });
}

export function deleteTask(gtId: string): Promise<void> {
  return request(`/api/tasks/${encodeURIComponent(gtId)}`, { method: "DELETE" });
}

export function getLabels(): Promise<{ labels: LabelDTO[] }> {
  return request("/api/labels");
}

export interface CreateLabelInput {
  name: string;
  colour: LabelColour;
  icon: LabelIconName;
}

export function createLabel(input: CreateLabelInput): Promise<{ label: LabelDTO }> {
  return request("/api/labels", { method: "POST", body: JSON.stringify(input) });
}

export interface UpdateLabelInput {
  name?: string;
  colour?: LabelColour;
  icon?: LabelIconName;
}

export function updateLabel(id: number, input: UpdateLabelInput): Promise<{ label: LabelDTO }> {
  return request(`/api/labels/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteLabel(id: number): Promise<void> {
  return request(`/api/labels/${id}`, { method: "DELETE" });
}

export function setTaskLabels(gtId: string, labelIds: number[]): Promise<{ labels: LabelDTO[] }> {
  return request(`/api/tasks/${encodeURIComponent(gtId)}/labels`, {
    method: "PUT",
    body: JSON.stringify({ labelIds }),
  });
}

export function setTaskStar(gtId: string, star: StarType): Promise<{ star: StarType }> {
  return request(`/api/tasks/${encodeURIComponent(gtId)}/star`, { method: "PUT", body: JSON.stringify({ star }) });
}

export function removeTaskStar(gtId: string): Promise<void> {
  return request(`/api/tasks/${encodeURIComponent(gtId)}/star`, { method: "DELETE" });
}
