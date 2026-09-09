import { asc } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { TaskListDTO } from "../../shared/types.js";
import { db } from "../db/client.js";
import { taskLists } from "../db/schema.js";

// Reads the SQLite mirror (kept current by sync/), not a live Google call: the frontend
// should not need to know anything about GT request construction (plan.md section 30, 39).
export async function taskListsRoutes(app: FastifyInstance) {
  app.get("/api/task-lists", async () => {
    const rows = await db.select().from(taskLists).orderBy(asc(taskLists.title));
    const result: TaskListDTO[] = rows.map((row) => ({ gtId: row.gtId, title: row.title }));
    return { taskLists: result };
  });
}
