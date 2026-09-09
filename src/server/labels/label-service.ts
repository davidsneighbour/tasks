import { eq, inArray } from "drizzle-orm";
import type { LabelDTO } from "../../shared/types.js";
import type { LabelColour, LabelIconName } from "../../shared/labels.js";
import { db } from "../db/client.js";
import { labels, taskLabels } from "../db/schema.js";

export class LabelNotFoundError extends Error {
  constructor(id: number) {
    super(`Label ${id} was not found.`);
    this.name = "LabelNotFoundError";
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function toLabelDTO(row: typeof labels.$inferSelect): LabelDTO {
  return { id: row.id, name: row.name, colour: row.colour, icon: row.icon };
}

export async function listLabels(): Promise<LabelDTO[]> {
  const rows = await db.select().from(labels).orderBy(labels.name);
  return rows.map(toLabelDTO);
}

export interface CreateLabelInput {
  name: string;
  colour: LabelColour;
  icon: LabelIconName;
}

// Purely local - GT has no concept of labels (plan.md section 9).
export async function createLabel(input: CreateLabelInput): Promise<LabelDTO> {
  const now = nowIso();
  const [row] = await db
    .insert(labels)
    .values({ name: input.name, colour: input.colour, icon: input.icon, createdAt: now, updatedAt: now })
    .returning();
  if (!row) throw new Error("Failed to create label.");
  return toLabelDTO(row);
}

export interface UpdateLabelInput {
  name?: string | undefined;
  colour?: LabelColour | undefined;
  icon?: LabelIconName | undefined;
}

export async function updateLabel(id: number, input: UpdateLabelInput): Promise<LabelDTO> {
  const [row] = await db.update(labels).set({ ...input, updatedAt: nowIso() }).where(eq(labels.id, id)).returning();
  if (!row) throw new LabelNotFoundError(id);
  return toLabelDTO(row);
}

// Deletes only the local label and its associations; GT is never touched
// (plan.md sections 9, 39).
export async function deleteLabel(id: number): Promise<void> {
  const result = await db.delete(labels).where(eq(labels.id, id)).returning({ id: labels.id });
  if (result.length === 0) throw new LabelNotFoundError(id);
}

// Replaces a task's full label set in one call, matching PUT semantics
// (plan.md section 30: PUT /api/tasks/:gtTaskId/labels). Purely local - immediate, no GT
// round trip (plan.md section 26).
export async function setTaskLabels(taskGtId: string, labelIds: number[]): Promise<LabelDTO[]> {
  await db.delete(taskLabels).where(eq(taskLabels.taskGtId, taskGtId));

  if (labelIds.length > 0) {
    const now = nowIso();
    await db.insert(taskLabels).values(labelIds.map((labelId) => ({ taskGtId, labelId, createdAt: now })));
  }

  const map = await getLabelsForTasks([taskGtId]);
  return map.get(taskGtId) ?? [];
}

// Batched lookup so attaching labels to a list of tasks (e.g. a whole view) is one query,
// not one per task.
export async function getLabelsForTasks(taskGtIds: string[]): Promise<Map<string, LabelDTO[]>> {
  const map = new Map<string, LabelDTO[]>();
  if (taskGtIds.length === 0) return map;

  const rows = await db
    .select({ taskGtId: taskLabels.taskGtId, label: labels })
    .from(taskLabels)
    .innerJoin(labels, eq(taskLabels.labelId, labels.id))
    .where(inArray(taskLabels.taskGtId, taskGtIds));

  for (const row of rows) {
    const existing = map.get(row.taskGtId) ?? [];
    existing.push(toLabelDTO(row.label));
    map.set(row.taskGtId, existing);
  }

  return map;
}
