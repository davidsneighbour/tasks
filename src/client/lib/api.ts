import type { StatusResponse, TaskDTO, TaskListDTO } from "@shared/types";

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

export function getTaskLists(): Promise<{ taskLists: TaskListDTO[] }> {
  return request("/api/task-lists");
}

export function getTasks(params: { view?: string; list?: string } = {}): Promise<{ tasks: TaskDTO[] }> {
  const search = new URLSearchParams();
  if (params.view) search.set("view", params.view);
  if (params.list) search.set("list", params.list);
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
