import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { tasks } from "../db/schema.js";
import { dueDateString, todayDateString } from "./date.js";

// Incomplete tasks with due < today, using the local calendar date (plan.md section 13).
export async function getOverdueTasks() {
  const today = todayDateString();
  const incomplete = await db.select().from(tasks).where(eq(tasks.status, "needsAction"));

  return incomplete
    .filter((task) => {
      const due = dueDateString(task.due);
      return due !== null && due < today;
    })
    .sort((a, b) => (dueDateString(a.due) ?? "").localeCompare(dueDateString(b.due) ?? ""));
}
