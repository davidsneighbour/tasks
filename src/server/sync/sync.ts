import { eq, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import { syncState, taskLists, tasks } from "../db/schema.js";
import { diffTaskLists, diffTasks, type TaskDiff, type TaskListDiff } from "./reconciliation.js";
import { fetchRemoteTaskLists } from "./sync-task-lists.js";
import { fetchRemoteTasks } from "./sync-tasks.js";

export interface SyncCounts {
  listsAdded: number;
  listsUpdated: number;
  listsRemoved: number;
  tasksAdded: number;
  tasksUpdated: number;
  tasksRemoved: number;
}

export type SyncResult = ({ status: "success" } & SyncCounts) | { status: "error"; message: string };

function nowIso(): string {
  return new Date().toISOString();
}

async function setSyncState(patch: {
  status: "syncing" | "success" | "error";
  lastStartedAt?: string;
  lastCompletedAt?: string;
  lastError?: string | null;
}): Promise<void> {
  const existing = await db.select().from(syncState).limit(1);

  if (existing.length === 0) {
    await db.insert(syncState).values({ id: 1, ...patch });
    return;
  }

  await db.update(syncState).set(patch).where(eq(syncState.id, 1));
}

export interface SyncStateRow {
  status: "idle" | "syncing" | "success" | "error";
  lastStartedAt: string | null;
  lastCompletedAt: string | null;
  lastError: string | null;
}

export async function getSyncState(): Promise<SyncStateRow> {
  const rows = await db.select().from(syncState).limit(1);
  return rows[0] ?? { status: "idle", lastStartedAt: null, lastCompletedAt: null, lastError: null };
}

// Single SQLite transaction: either every upsert/delete for this reconciliation lands, or
// none of it does (plan.md section 45).
async function applyReconciliation(listDiff: TaskListDiff, taskDiff: TaskDiff): Promise<SyncCounts> {
  return db.transaction(async (tx) => {
    const syncedAt = nowIso();

    for (const list of listDiff.toInsert) {
      await tx.insert(taskLists).values({ ...list, syncedAt });
    }
    for (const list of listDiff.toUpdate) {
      await tx
        .update(taskLists)
        .set({ title: list.title, gtUpdatedAt: list.gtUpdatedAt, syncedAt })
        .where(eq(taskLists.gtId, list.gtId));
    }

    for (const task of taskDiff.toInsert) {
      await tx.insert(tasks).values({ ...task, syncedAt });
    }
    for (const task of taskDiff.toUpdate) {
      const { gtId, ...fields } = task;
      await tx.update(tasks).set({ ...fields, syncedAt }).where(eq(tasks.gtId, gtId));
    }

    // Tasks before lists: a list's tasks are always a subset of taskDiff.toDeleteGtIds
    // already (its list was never fetched, so none of its tasks appear in remote records),
    // and tasks.gtTaskListId has ON DELETE CASCADE as a safety net regardless of order.
    if (taskDiff.toDeleteGtIds.length > 0) {
      await tx.delete(tasks).where(inArray(tasks.gtId, taskDiff.toDeleteGtIds));
    }
    if (listDiff.toDeleteGtIds.length > 0) {
      await tx.delete(taskLists).where(inArray(taskLists.gtId, listDiff.toDeleteGtIds));
    }

    return {
      listsAdded: listDiff.toInsert.length,
      listsUpdated: listDiff.toUpdate.length,
      listsRemoved: listDiff.toDeleteGtIds.length,
      tasksAdded: taskDiff.toInsert.length,
      tasksUpdated: taskDiff.toUpdate.length,
      tasksRemoved: taskDiff.toDeleteGtIds.length,
    };
  });
}

async function performSync(): Promise<SyncResult> {
  await setSyncState({ status: "syncing", lastStartedAt: nowIso() });

  try {
    // Fetch everything before writing anything: a partial remote fetch must never cause a
    // deletion (plan.md section 44).
    const remoteLists = await fetchRemoteTaskLists();
    const remoteTasks = await fetchRemoteTasks(remoteLists.map((list) => list.gtId));

    const localLists = await db.select().from(taskLists);
    const localTasks = await db.select().from(tasks);

    const listDiff = diffTaskLists(remoteLists, localLists);
    const taskDiff = diffTasks(remoteTasks, localTasks);

    const counts = await applyReconciliation(listDiff, taskDiff);

    await setSyncState({ status: "success", lastCompletedAt: nowIso(), lastError: null });

    return { status: "success", ...counts };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await setSyncState({ status: "error", lastError: message });
    return { status: "error", message };
  }
}

// Process-level mutex (plan.md section 28): no distributed locking needed since there is one
// process. A concurrent call gets the in-flight sync's result instead of starting a second one.
let inFlightSync: Promise<SyncResult> | null = null;

export function isSyncing(): boolean {
  return inFlightSync !== null;
}

export function runSync(): Promise<SyncResult> {
  if (!inFlightSync) {
    inFlightSync = performSync().finally(() => {
      inFlightSync = null;
    });
  }
  return inFlightSync;
}
