import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { tasks } from "../db/schema.js";
import { addDays, dueDateString, todayDateString } from "./date.js";

// Incomplete tasks due today or in the future within a configurable window, default
// today + 7 days (plan.md sections 12, 49). Kept as a query/service module, not buried in
// a UI component, so the rule can evolve independently.
export async function getNextTasks(windowDays = 7) {
  const today = todayDateString();
  const windowEnd = addDays(today, windowDays);

  const incomplete = await db.select().from(tasks).where(eq(tasks.status, "needsAction"));

  return incomplete
    .filter((task) => {
      const due = dueDateString(task.due);
      return due !== null && due >= today && due <= windowEnd;
    })
    .sort((a, b) => (dueDateString(a.due) ?? "").localeCompare(dueDateString(b.due) ?? ""));
}
