import { asc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { TaskDTO } from "../../shared/types.js";
import { db } from "../db/client.js";
import { tasks } from "../db/schema.js";
import { getAllTasks } from "../views/all.js";
import { getCompletedTasks } from "../views/completed.js";
import { getNextTasks } from "../views/next.js";
import { getOverdueTasks } from "../views/overdue.js";

type TaskRow = typeof tasks.$inferSelect;

function toTaskDTO(row: TaskRow): TaskDTO {
  return {
    gtId: row.gtId,
    gtTaskListId: row.gtTaskListId,
    gtParentId: row.gtParentId,
    title: row.title,
    notes: row.notes,
    status: row.status,
    due: row.due,
    completedAt: row.completedAt,
    position: row.position,
  };
}

const VIEW_LOADERS: Record<string, () => Promise<TaskRow[]>> = {
  all: getAllTasks,
  completed: getCompletedTasks,
  next: getNextTasks,
  overdue: getOverdueTasks,
};

interface TasksQuery {
  view?: string;
  list?: string;
}

// Reads only from the SQLite cache, never Google directly (plan.md's whole point of
// maintaining a local mirror "for fast rendering and filtering").
export async function tasksRoutes(app: FastifyInstance) {
  app.get<{ Querystring: TasksQuery }>("/api/tasks", async (request, reply) => {
    const { view, list } = request.query;

    if (list) {
      const rows = await db.select().from(tasks).where(eq(tasks.gtTaskListId, list)).orderBy(asc(tasks.position));
      return { tasks: rows.map(toTaskDTO) };
    }

    const loader = VIEW_LOADERS[view ?? "all"];
    if (!loader) {
      reply.code(400).send({ error: "validation", message: `Unknown view "${view}".` });
      return;
    }

    const rows = await loader();
    return { tasks: rows.map(toTaskDTO) };
  });
}
