import { eq, inArray } from "drizzle-orm";
import type { StarType } from "../../shared/stars.js";
import { db } from "../db/client.js";
import { taskStars } from "../db/schema.js";

function nowIso(): string {
  return new Date().toISOString();
}

// Purely local, immediate (plan.md sections 10, 26): no GT round trip, and setting a star
// replaces any existing one rather than allowing more than one at a time.
export async function setTaskStar(taskGtId: string, star: StarType): Promise<void> {
  const now = nowIso();
  const existing = await db.select({ taskGtId: taskStars.taskGtId }).from(taskStars).where(eq(taskStars.taskGtId, taskGtId)).limit(1);

  if (existing.length === 0) {
    await db.insert(taskStars).values({ taskGtId, star, updatedAt: now });
  } else {
    await db.update(taskStars).set({ star, updatedAt: now }).where(eq(taskStars.taskGtId, taskGtId));
  }
}

export async function removeTaskStar(taskGtId: string): Promise<void> {
  await db.delete(taskStars).where(eq(taskStars.taskGtId, taskGtId));
}

// Batched lookup, mirroring labels/getLabelsForTasks: one query per view render, not one
// per task.
export async function getStarsForTasks(taskGtIds: string[]): Promise<Map<string, StarType>> {
  const map = new Map<string, StarType>();
  if (taskGtIds.length === 0) return map;

  const rows = await db.select().from(taskStars).where(inArray(taskStars.taskGtId, taskGtIds));
  for (const row of rows) {
    map.set(row.taskGtId, row.star);
  }
  return map;
}
