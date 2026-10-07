import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { taskLabels, tasks } from "../db/schema.js";

// Tasks carrying a given label; backs the label view opened by clicking a label.
export async function getTasksByLabel(labelId: number) {
  const rows = await db
    .select({ task: tasks })
    .from(taskLabels)
    .innerJoin(tasks, eq(taskLabels.taskGtId, tasks.gtId))
    .where(eq(taskLabels.labelId, labelId));

  return rows.map((row) => row.task);
}
