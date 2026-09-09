import { eq } from "drizzle-orm";
import type { TaskDTO } from "../../shared/types.js";
import { db } from "../db/client.js";
import { tasks } from "../db/schema.js";
import { googleTasksClient, type GoogleTask } from "../google/index.js";
import { getLabelsForTasks } from "../labels/label-service.js";
import { getStarsForTasks } from "../stars/star-service.js";
import { mapGoogleTask } from "../sync/reconciliation.js";
import { toTaskDTO } from "./dto.js";

export class TaskNotFoundError extends Error {
  constructor(gtId: string) {
    super(`Task ${gtId} was not found in the local cache. Run a sync first.`);
    this.name = "TaskNotFoundError";
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

// Google's per-task endpoints are scoped to a task list; the local cache is the fast way to
// resolve which list a known task belongs to. This is a read, not a mutation, so it does not
// break the "GT first" invariant below.
async function requireLocalTaskListId(taskGtId: string): Promise<string> {
  const rows = await db.select({ gtTaskListId: tasks.gtTaskListId }).from(tasks).where(eq(tasks.gtId, taskGtId)).limit(1);
  const row = rows[0];
  if (!row) throw new TaskNotFoundError(taskGtId);
  return row.gtTaskListId;
}

// The single place a GT response is written into the cache after a mutation: GT confirms
// first, the local write happens second, never the other way around (plan.md section 63).
async function applyGoogleTask(taskListGtId: string, googleTask: GoogleTask): Promise<TaskDTO> {
  const mapped = mapGoogleTask(taskListGtId, googleTask);
  const syncedAt = nowIso();

  if (!mapped) {
    await db.delete(tasks).where(eq(tasks.gtId, googleTask.id));
    throw new TaskNotFoundError(googleTask.id);
  }

  const existing = await db.select({ gtId: tasks.gtId }).from(tasks).where(eq(tasks.gtId, mapped.gtId)).limit(1);

  if (existing.length === 0) {
    await db.insert(tasks).values({ ...mapped, syncedAt });
  } else {
    const { gtId, ...fields } = mapped;
    await db.update(tasks).set({ ...fields, syncedAt }).where(eq(tasks.gtId, gtId));
  }

  const [labelsByTask, starsByTask] = await Promise.all([
    getLabelsForTasks([mapped.gtId]),
    getStarsForTasks([mapped.gtId]),
  ]);
  return toTaskDTO(mapped, labelsByTask.get(mapped.gtId), starsByTask.get(mapped.gtId) ?? null);
}

export interface CreateTaskInput {
  taskListGtId: string;
  title: string;
  notes?: string | undefined;
  due?: string | undefined;
  parentGtId?: string | undefined;
}

// Remote-first: never create a local row before GT confirms the task exists
// (plan.md section 22).
export async function createTask(input: CreateTaskInput): Promise<TaskDTO> {
  const googleTask = await googleTasksClient.createTask(input.taskListGtId, {
    title: input.title,
    ...(input.notes !== undefined && { notes: input.notes }),
    ...(input.due !== undefined && { due: input.due }),
    ...(input.parentGtId !== undefined && { parent: input.parentGtId }),
  });
  return applyGoogleTask(input.taskListGtId, googleTask);
}

export interface UpdateTaskInput {
  title?: string | undefined;
  notes?: string | undefined;
  due?: string | null | undefined;
}

// Remote-first update (plan.md section 23).
export async function updateTask(taskGtId: string, input: UpdateTaskInput): Promise<TaskDTO> {
  const taskListGtId = await requireLocalTaskListId(taskGtId);
  const googleTask = await googleTasksClient.updateTask(taskListGtId, taskGtId, input);
  return applyGoogleTask(taskListGtId, googleTask);
}

// Remote-first complete/reopen (plan.md section 24): the cache is only updated from GT's
// confirmed response, never flipped locally first.
export async function completeTask(taskGtId: string): Promise<TaskDTO> {
  const taskListGtId = await requireLocalTaskListId(taskGtId);
  const googleTask = await googleTasksClient.completeTask(taskListGtId, taskGtId);
  return applyGoogleTask(taskListGtId, googleTask);
}

export async function reopenTask(taskGtId: string): Promise<TaskDTO> {
  const taskListGtId = await requireLocalTaskListId(taskGtId);
  const googleTask = await googleTasksClient.reopenTask(taskListGtId, taskGtId);
  return applyGoogleTask(taskListGtId, googleTask);
}

// Remote-first delete: a GT failure leaves the local task untouched (plan.md section 25).
export async function deleteTask(taskGtId: string): Promise<void> {
  const taskListGtId = await requireLocalTaskListId(taskGtId);
  await googleTasksClient.deleteTask(taskListGtId, taskGtId);
  await db.delete(tasks).where(eq(tasks.gtId, taskGtId));
}
