import { eq, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import { taskListOrder } from "../db/schema.js";

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
