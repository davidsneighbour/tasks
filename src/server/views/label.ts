import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { taskLabels, tasks } from "../db/schema.js";

// Tasks carrying a given label (plan.md section 49: "Clicking a label displays all tasks
// carrying it").
export async function getTasksByLabel(labelId: number) {
  const rows = await db
    .select({ task: tasks })
    .from(taskLabels)
    .innerJoin(tasks, eq(taskLabels.taskGtId, tasks.gtId))
    .where(eq(taskLabels.labelId, labelId));

  return rows.map((row) => row.task);
}
