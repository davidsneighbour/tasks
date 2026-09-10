import { eq } from "drizzle-orm";
import type { TaskListDTO } from "../../shared/types.js";
import { db } from "../db/client.js";
import { defaultTaskList } from "../db/schema.js";
import { getOrderedTaskLists } from "./task-list-order-service.js";

function nowIso(): string {
  return new Date().toISOString();
}

// Singleton row (id = 1), matching sync_state (issue #20). A missing row and a null value
// both mean "no configured default".
async function getRow() {
  const rows = await db.select().from(defaultTaskList).limit(1);
  return rows[0] ?? null;
}

export async function getConfiguredDefaultTaskListGtId(): Promise<string | null> {
  const row = await getRow();
  return row?.taskListGtId ?? null;
}

export async function setDefaultTaskList(gtId: string | null): Promise<void> {
  const now = nowIso();
  const row = await getRow();

  if (row) {
    await db.update(defaultTaskList).set({ taskListGtId: gtId, updatedAt: now }).where(eq(defaultTaskList.id, row.id));
  } else {
    await db.insert(defaultTaskList).values({ taskListGtId: gtId, updatedAt: now });
  }
}

export async function getEffectiveDefaultTaskList(): Promise<TaskListDTO | null> {
  const orderedLists = await getOrderedTaskLists();
  const configuredGtId = await getConfiguredDefaultTaskListGtId();

  const configured = configuredGtId ? orderedLists.find((list) => list.gtId === configuredGtId) : undefined;
  return configured ?? orderedLists[0] ?? null;
}
