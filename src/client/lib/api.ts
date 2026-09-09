import type { StatusResponse, TaskDTO, TaskListDTO } from "@shared/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Request to ${path} failed with status ${response.status}.`);
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
