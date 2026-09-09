import { googleTasksRequest } from "./client.js";

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: "needsAction" | "completed";
  due?: string;
  completed?: string;
  parent?: string;
  position: string;
  etag: string;
  updated: string;
  deleted?: boolean;
  hidden?: boolean;
}

interface TasksResponse {
  items?: GoogleTask[];
  nextPageToken?: string;
}

// Must explicitly request completed/hidden/deleted tasks and paginate to completion, or
// reconciliation cannot correctly detect what disappeared from GT (plan.md sections 20, 64).
export async function listTasks(taskListId: string): Promise<GoogleTask[]> {
  const tasks: GoogleTask[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      showCompleted: "true",
      showHidden: "true",
      showDeleted: "true",
      maxResults: "100",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const response = await googleTasksRequest<TasksResponse>(
      `/lists/${encodeURIComponent(taskListId)}/tasks?${params.toString()}`,
    );
    tasks.push(...(response.items ?? []));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return tasks;
}

export interface CreateTaskInput {
  title: string;
  notes?: string;
  due?: string;
  parent?: string;
}

export async function createTask(taskListId: string, input: CreateTaskInput): Promise<GoogleTask> {
  return googleTasksRequest<GoogleTask>(`/lists/${encodeURIComponent(taskListId)}/tasks`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface UpdateTaskInput {
  title?: string | undefined;
  notes?: string | undefined;
  due?: string | null | undefined;
}

export async function updateTask(taskListId: string, taskId: string, input: UpdateTaskInput): Promise<GoogleTask> {
  return googleTasksRequest<GoogleTask>(`/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function completeTask(taskListId: string, taskId: string): Promise<GoogleTask> {
  return googleTasksRequest<GoogleTask>(`/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "completed" }),
  });
}

export async function reopenTask(taskListId: string, taskId: string): Promise<GoogleTask> {
  return googleTasksRequest<GoogleTask>(`/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "needsAction", completed: null }),
  });
}

export async function deleteTask(taskListId: string, taskId: string): Promise<void> {
  await googleTasksRequest<void>(`/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`, {
    method: "DELETE",
  });
}

export interface MoveTaskOptions {
  parent?: string;
  previous?: string;
}

export async function moveTask(taskListId: string, taskId: string, options: MoveTaskOptions = {}): Promise<GoogleTask> {
  const params = new URLSearchParams();
  if (options.parent) params.set("parent", options.parent);
  if (options.previous) params.set("previous", options.previous);
  const query = params.size > 0 ? `?${params.toString()}` : "";

  return googleTasksRequest<GoogleTask>(
    `/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}/move${query}`,
    { method: "POST" },
  );
}
