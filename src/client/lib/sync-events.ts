// A manual sync can change task lists, tasks, and (indirectly) what views show. Several
// independent components need to refetch afterwards; this is the same small event-bus pattern
// as label-events.ts, generalised to "a sync just finished."
const SYNC_COMPLETED_EVENT = "tasks:sync-completed";

export function notifySyncCompleted(): void {
  window.dispatchEvent(new Event(SYNC_COMPLETED_EVENT));
}

export function onSyncCompleted(handler: () => void): () => void {
  window.addEventListener(SYNC_COMPLETED_EVENT, handler);
  return () => window.removeEventListener(SYNC_COMPLETED_EVENT, handler);
}
