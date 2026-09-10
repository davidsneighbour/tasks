import { eq, inArray } from "drizzle-orm";
import type { TaskListDTO } from "../../shared/types.js";
import { db } from "../db/client.js";
import { taskListOrder, taskLists } from "../db/schema.js";

function nowIso(): string {
  return new Date().toISOString();
}

// Persists a full reordering in one transaction (issue #18): each list's position becomes
// its index in the given array, replacing any existing stored position for that list.
export async function setTaskListOrder(gtIds: string[]): Promise<void> {
  const now = nowIso();

  await db.transaction(async (tx) => {
    const existing = await tx
      .select({ taskListGtId: taskListOrder.taskListGtId })
      .from(taskListOrder)
      .where(inArray(taskListOrder.taskListGtId, gtIds));
    const existingIds = new Set(existing.map((row) => row.taskListGtId));

    for (const [index, gtId] of gtIds.entries()) {
      if (existingIds.has(gtId)) {
        await tx.update(taskListOrder).set({ position: index, updatedAt: now }).where(eq(taskListOrder.taskListGtId, gtId));
      } else {
        await tx.insert(taskListOrder).values({ taskListGtId: gtId, position: index, updatedAt: now });
      }
    }
  });
}

// A list with no row here has no custom position yet (issue #18); callers fall back to
// alphabetical order for those.
export async function getTaskListPositions(): Promise<Map<string, number>> {
  const rows = await db.select().from(taskListOrder);
  return new Map(rows.map((row) => [row.taskListGtId, row.position]));
}

// The sidebar's effective order (issue #18): lists with a stored position sort by it first,
// then any list synced from GT without one yet falls back to alphabetical, appended after.
// Shared with default-task-list-service.ts, which uses "the first list here" as its fallback.
export async function getOrderedTaskLists(): Promise<TaskListDTO[]> {
  const [rows, positions] = await Promise.all([db.select().from(taskLists), getTaskListPositions()]);

  const ordered = rows.filter((row) => positions.has(row.gtId)).sort((a, b) => positions.get(a.gtId)! - positions.get(b.gtId)!);
  const unordered = rows.filter((row) => !positions.has(row.gtId)).sort((a, b) => a.title.localeCompare(b.title));

  return [...ordered, ...unordered].map((row) => ({ gtId: row.gtId, title: row.title }));
}
