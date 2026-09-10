import { eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { taskLists } from "../db/schema.js";
import { getConfiguredDefaultTaskListGtId, setDefaultTaskList } from "../task-lists/default-task-list-service.js";
import { getOrderedTaskLists, setTaskListOrder } from "../task-lists/task-list-order-service.js";

const setOrderSchema = z.object({
  gtIds: z.array(z.string().min(1)).min(1),
});

const setDefaultSchema = z.object({
  gtId: z.string().min(1).nullable(),
});

class UnknownTaskListError extends Error {}

function sendTaskListError(reply: FastifyReply, error: unknown): void {
  if (error instanceof z.ZodError) {
    reply.code(400).send({ error: "validation", message: error.issues.map((issue) => issue.message).join("; ") });
    return;
  }
  if (error instanceof UnknownTaskListError) {
    reply.code(400).send({ error: "validation", message: error.message });
    return;
  }
  throw error;
}

// Reads the SQLite mirror (kept current by sync/), not a live Google call: the frontend
// should not need to know anything about GT request construction (plan.md section 30, 39).
export async function taskListsRoutes(app: FastifyInstance) {
  app.get("/api/task-lists", async () => {
    const [result, defaultTaskListGtId] = await Promise.all([getOrderedTaskLists(), getConfiguredDefaultTaskListGtId()]);
    return { taskLists: result, defaultTaskListGtId };
  });

  app.put("/api/task-lists/order", async (request, reply) => {
    try {
      const input = setOrderSchema.parse(request.body);
      await setTaskListOrder(input.gtIds);
      return { ok: true };
    } catch (error) {
      sendTaskListError(reply, error);
      return;
    }
  });

  app.put("/api/task-lists/default", async (request, reply) => {
    try {
      const input = setDefaultSchema.parse(request.body);
      if (input.gtId !== null) {
        const [match] = await db.select({ gtId: taskLists.gtId }).from(taskLists).where(eq(taskLists.gtId, input.gtId)).limit(1);
        if (!match) throw new UnknownTaskListError(`No task list with id "${input.gtId}" exists.`);
      }
      await setDefaultTaskList(input.gtId);
      return { ok: true };
    } catch (error) {
      sendTaskListError(reply, error);
      return;
    }
  });
}
