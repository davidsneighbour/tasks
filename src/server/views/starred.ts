import { eq } from "drizzle-orm";
import type { StarType } from "../../shared/stars.js";
import { db } from "../db/client.js";
import { taskStars, tasks } from "../db/schema.js";

// Tasks where local star metadata exists, optionally filtered to one star type
// (plan.md section 49).
export async function getStarredTasks(star?: StarType) {
  const rows = await db
    .select({ task: tasks })
    .from(taskStars)
    .innerJoin(tasks, eq(taskStars.taskGtId, tasks.gtId))
    .where(star ? eq(taskStars.star, star) : undefined);

  return rows.map((row) => row.task);
}
