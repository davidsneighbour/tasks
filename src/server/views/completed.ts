import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { tasks } from "../db/schema.js";

// Completed tasks, most recently completed first (plan.md section 49).
export async function getCompletedTasks() {
  const rows = await db.select().from(tasks).where(eq(tasks.status, "completed"));
  return rows.sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
}
