import { asc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { tasks } from "../db/schema.js";

// All incomplete tasks (plan.md section 49), respecting GT ordering within each list.
export async function getAllTasks() {
  return db.select().from(tasks).where(eq(tasks.status, "needsAction")).orderBy(asc(tasks.gtTaskListId), asc(tasks.position));
}
