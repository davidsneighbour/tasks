import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import type { TaskListDTO } from "../../shared/types.js";
import { db } from "../db/client.js";
import { taskLists } from "../db/schema.js";
import { getTaskListPositions, setTaskListOrder } from "../task-lists/task-list-order-service.js";

const setOrderSchema = z.object({
  gtIds: z.array(z.string().min(1)).min(1),
});

function sendTaskListOrderError(reply: FastifyReply, error: unknown): void {
  if (error instanceof z.ZodError) {
    reply.code(400).send({ error: "validation", message: error.issues.map((issue) => issue.message).join("; ") });
    return;
  }
  throw error;
}

// Reads the SQLite mirror (kept current by sync/), not a live Google call: the frontend
// should not need to know anything about GT request construction (plan.md section 30, 39).
export async function taskListsRoutes(app: FastifyInstance) {
  app.get("/api/task-lists", async () => {
    const [rows, positions] = await Promise.all([db.select().from(taskLists), getTaskListPositions()]);

    // Lists with a stored position (issue #18) sort by it first; any list synced from GT
    // without one yet falls back to alphabetical order, appended after the ordered ones.
    const ordered = rows.filter((row) => positions.has(row.gtId)).sort((a, b) => positions.get(a.gtId)! - positions.get(b.gtId)!);
    const unordered = rows.filter((row) => !positions.has(row.gtId)).sort((a, b) => a.title.localeCompare(b.title));

    const result: TaskListDTO[] = [...ordered, ...unordered].map((row) => ({ gtId: row.gtId, title: row.title }));
    return { taskLists: result };
  });

  app.put("/api/task-lists/order", async (request, reply) => {
    try {
      const input = setOrderSchema.parse(request.body);
      await setTaskListOrder(input.gtIds);
      return { ok: true };
    } catch (error) {
      sendTaskListOrderError(reply, error);
      return;
    }
  });
}
