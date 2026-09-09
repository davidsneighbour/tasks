import { asc, eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { tasks } from "../db/schema.js";
import { GoogleApiError, MissingGoogleCredentialsError, httpStatusForGoogleApiError } from "../google/index.js";
import { getLabelsForTasks } from "../labels/label-service.js";
import * as taskService from "../tasks/task-service.js";
import { toTaskDTO } from "../tasks/dto.js";
import { getAllTasks } from "../views/all.js";
import { getCompletedTasks } from "../views/completed.js";
import { getTasksByLabel } from "../views/label.js";
import { getNextTasks } from "../views/next.js";
import { getOverdueTasks } from "../views/overdue.js";

type TaskRow = typeof tasks.$inferSelect;

const VIEW_LOADERS: Record<string, () => Promise<TaskRow[]>> = {
  all: getAllTasks,
  completed: getCompletedTasks,
  next: getNextTasks,
  overdue: getOverdueTasks,
};

interface TasksQuery {
  view?: string;
  list?: string;
  label?: string;
}

const createTaskSchema = z.object({
  taskListGtId: z.string().min(1),
  title: z.string().min(1),
  notes: z.string().optional(),
  due: z.string().optional(),
  parentGtId: z.string().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  notes: z.string().optional(),
  due: z.string().nullable().optional(),
});

// Every GT operation must distinguish auth/network/rate-limit/not-found/validation/unexpected
// failures (plan.md section 29); this maps each of the ways a mutation can fail to a status.
function sendTaskServiceError(reply: FastifyReply, error: unknown): void {
  if (error instanceof z.ZodError) {
    reply.code(400).send({ error: "validation", message: error.issues.map((issue) => issue.message).join("; ") });
    return;
  }
  if (error instanceof taskService.TaskNotFoundError) {
    reply.code(404).send({ error: "not-found", message: error.message });
    return;
  }
  if (error instanceof MissingGoogleCredentialsError) {
    reply.code(401).send({ error: "authentication", message: error.message });
    return;
  }
  if (error instanceof GoogleApiError) {
    reply.code(httpStatusForGoogleApiError(error)).send({ error: error.kind, message: error.message });
    return;
  }
  throw error;
}

// Reads go straight to the SQLite cache, never to Google directly (plan.md's whole point of
// a local mirror "for fast rendering and filtering"). Mutations are remote-first, delegated
// to tasks/task-service.ts (plan.md sections 22-25, 63).
export async function tasksRoutes(app: FastifyInstance) {
  app.get<{ Querystring: TasksQuery }>("/api/tasks", async (request, reply) => {
    const { view, list, label } = request.query;

    if (list) {
      const rows = await db.select().from(tasks).where(eq(tasks.gtTaskListId, list)).orderBy(asc(tasks.position));
      const labelsByTask = await getLabelsForTasks(rows.map((row) => row.gtId));
      return { tasks: rows.map((row) => toTaskDTO(row, labelsByTask.get(row.gtId))) };
    }

    if (label) {
      const labelId = Number(label);
      if (!Number.isInteger(labelId)) {
        reply.code(400).send({ error: "validation", message: `Invalid label id "${label}".` });
        return;
      }
      const rows = await getTasksByLabel(labelId);
      const labelsByTask = await getLabelsForTasks(rows.map((row) => row.gtId));
      return { tasks: rows.map((row) => toTaskDTO(row, labelsByTask.get(row.gtId))) };
    }

    const loader = VIEW_LOADERS[view ?? "all"];
    if (!loader) {
      reply.code(400).send({ error: "validation", message: `Unknown view "${view}".` });
      return;
    }

    const rows = await loader();
    const labelsByTask = await getLabelsForTasks(rows.map((row) => row.gtId));
    return { tasks: rows.map((row) => toTaskDTO(row, labelsByTask.get(row.gtId))) };
  });

  app.post("/api/tasks", async (request, reply) => {
    try {
      const input = createTaskSchema.parse(request.body);
      const task = await taskService.createTask(input);
      reply.code(201);
      return { task };
    } catch (error) {
      sendTaskServiceError(reply, error);
      return;
    }
  });

  app.patch<{ Params: { gtTaskId: string } }>("/api/tasks/:gtTaskId", async (request, reply) => {
    try {
      const input = updateTaskSchema.parse(request.body);
      const task = await taskService.updateTask(request.params.gtTaskId, input);
      return { task };
    } catch (error) {
      sendTaskServiceError(reply, error);
      return;
    }
  });

  app.delete<{ Params: { gtTaskId: string } }>("/api/tasks/:gtTaskId", async (request, reply) => {
    try {
      await taskService.deleteTask(request.params.gtTaskId);
      reply.code(204);
      return null;
    } catch (error) {
      sendTaskServiceError(reply, error);
      return;
    }
  });

  app.post<{ Params: { gtTaskId: string } }>("/api/tasks/:gtTaskId/complete", async (request, reply) => {
    try {
      const task = await taskService.completeTask(request.params.gtTaskId);
      return { task };
    } catch (error) {
      sendTaskServiceError(reply, error);
      return;
    }
  });

  app.post<{ Params: { gtTaskId: string } }>("/api/tasks/:gtTaskId/reopen", async (request, reply) => {
    try {
      const task = await taskService.reopenTask(request.params.gtTaskId);
      return { task };
    } catch (error) {
      sendTaskServiceError(reply, error);
      return;
    }
  });
}
