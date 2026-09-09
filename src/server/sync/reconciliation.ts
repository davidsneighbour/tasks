import type { GoogleTask, GoogleTaskList } from "../google/index.js";

// Pure diff logic: no I/O, no SQLite, no Google API. Given what's remote and what's local,
// decide what changes to apply. This is the core of the system (plan.md section 14) and is
// exercised directly by reconciliation.spec.ts.

export interface RemoteTaskListRecord {
  gtId: string;
  title: string;
  gtUpdatedAt: string;
}

export interface LocalTaskListRecord {
  gtId: string;
  title: string;
  gtUpdatedAt: string;
}

export interface TaskListDiff {
  toInsert: RemoteTaskListRecord[];
  toUpdate: RemoteTaskListRecord[];
  toDeleteGtIds: string[];
}

export function mapGoogleTaskList(list: GoogleTaskList): RemoteTaskListRecord {
  return { gtId: list.id, title: list.title, gtUpdatedAt: list.updated };
}

// GT is authoritative: remote wins whenever it disagrees with the local cache
// (plan.md section 2.1, 19).
export function diffTaskLists(remote: RemoteTaskListRecord[], local: LocalTaskListRecord[]): TaskListDiff {
  const localByGtId = new Map(local.map((row) => [row.gtId, row]));
  const remoteGtIds = new Set(remote.map((row) => row.gtId));

  const toInsert: RemoteTaskListRecord[] = [];
  const toUpdate: RemoteTaskListRecord[] = [];

  for (const remoteList of remote) {
    const existing = localByGtId.get(remoteList.gtId);
    if (!existing) {
      toInsert.push(remoteList);
    } else if (existing.title !== remoteList.title || existing.gtUpdatedAt !== remoteList.gtUpdatedAt) {
      toUpdate.push(remoteList);
    }
  }

  const toDeleteGtIds = local.filter((row) => !remoteGtIds.has(row.gtId)).map((row) => row.gtId);

  return { toInsert, toUpdate, toDeleteGtIds };
}

export interface RemoteTaskRecord {
  gtId: string;
  gtTaskListId: string;
  gtParentId: string | null;
  title: string;
  notes: string | null;
  status: "needsAction" | "completed";
  due: string | null;
  completedAt: string | null;
  position: string;
  etag: string;
  gtUpdatedAt: string;
}

export interface LocalTaskRecord {
  gtId: string;
  etag: string;
}

export interface TaskDiff {
  toInsert: RemoteTaskRecord[];
  toUpdate: RemoteTaskRecord[];
  toDeleteGtIds: string[];
}

// A task explicitly marked deleted by GT (only visible with showDeleted=true) is treated as
// absent, never upserted (plan.md section 64).
export function mapGoogleTask(taskListGtId: string, task: GoogleTask): RemoteTaskRecord | null {
  if (task.deleted) {
    return null;
  }

  return {
    gtId: task.id,
    gtTaskListId: taskListGtId,
    gtParentId: task.parent ?? null,
    title: task.title,
    notes: task.notes ?? null,
    status: task.status,
    due: task.due ?? null,
    completedAt: task.completed ?? null,
    position: task.position,
    etag: task.etag,
    gtUpdatedAt: task.updated,
  };
}

// The etag changes whenever GT changes anything about the task, so it is a sufficient (and
// simpler than field-by-field) signal that the cached GT-managed fields are stale.
export function diffTasks(remote: RemoteTaskRecord[], local: LocalTaskRecord[]): TaskDiff {
  const localByGtId = new Map(local.map((row) => [row.gtId, row]));
  const remoteGtIds = new Set(remote.map((row) => row.gtId));

  const toInsert: RemoteTaskRecord[] = [];
  const toUpdate: RemoteTaskRecord[] = [];

  for (const remoteTask of remote) {
    const existing = localByGtId.get(remoteTask.gtId);
    if (!existing) {
      toInsert.push(remoteTask);
    } else if (existing.etag !== remoteTask.etag) {
      toUpdate.push(remoteTask);
    }
  }

  const toDeleteGtIds = local.filter((row) => !remoteGtIds.has(row.gtId)).map((row) => row.gtId);

  return { toInsert, toUpdate, toDeleteGtIds };
}
