import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { tasks } from "../db/schema.js";
import { addDays, dueDateString, todayDateString } from "./date.js";

// Incomplete tasks whose due date is older than a configurable threshold, default 4 weeks
// (issue #13): tasks overdue by this much have likely been abandoned or forgotten.
export async function getDeadTasks(thresholdDays = 28) {
  const today = todayDateString();
  const cutoff = addDays(today, -thresholdDays);

  const incomplete = await db.select().from(tasks).where(eq(tasks.status, "needsAction"));

  return incomplete
    .filter((task) => {
      const due = dueDateString(task.due);
      return due !== null && due < cutoff;
    })
    .sort((a, b) => (dueDateString(a.due) ?? "").localeCompare(dueDateString(b.due) ?? ""));
}
