// Same small event-bus pattern as label-events.ts and sync-events.ts: lets TasksPage tell the
// AppShell sidebar (task counts, issue #15) to refetch after a task is created, completed,
// reopened, edited, or deleted.
const TASKS_CHANGED_EVENT = "tasks:tasks-changed";

export function notifyTasksChanged(): void {
  window.dispatchEvent(new Event(TASKS_CHANGED_EVENT));
}

export function onTasksChanged(handler: () => void): () => void {
  window.addEventListener(TASKS_CHANGED_EVENT, handler);
  return () => window.removeEventListener(TASKS_CHANGED_EVENT, handler);
}
