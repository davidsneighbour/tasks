import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/sqlite-proxy/migrator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db, sqlite } from "../db/client.js";
import { labels, taskLabels, taskLists, tasks } from "../db/schema.js";
import {
  LabelNotFoundError,
  createLabel,
  deleteLabel,
  getLabelsForTasks,
  listLabels,
  setTaskLabels,
  updateLabel,
} from "./label-service.js";

beforeAll(async () => {
  await migrate(
    db,
    async (queries) => {
      for (const query of queries) sqlite.exec(query);
    },
    { migrationsFolder: "./drizzle" },
  );
});

beforeEach(async () => {
  await db.delete(taskLabels);
  await db.delete(labels);
  await db.delete(tasks);
  await db.delete(taskLists);
  await db.insert(taskLists).values({
    gtId: "list-1",
    title: "Personal",
    gtUpdatedAt: "2024-01-01T00:00:00.000Z",
    syncedAt: "2024-01-01T00:00:00.000Z",
  });
  await db.insert(tasks).values({
    gtId: "task-1",
    gtTaskListId: "list-1",
    gtParentId: null,
    title: "Buy milk",
    notes: null,
    status: "needsAction",
    due: null,
    completedAt: null,
    position: "0",
    etag: "e1",
    gtUpdatedAt: "2024-01-01T00:00:00.000Z",
    syncedAt: "2024-01-01T00:00:00.000Z",
  });
});

describe("createLabel / listLabels / updateLabel / deleteLabel", () => {
  it("creates and lists a label, purely locally", async () => {
    const label = await createLabel({ name: "Urgent", colour: "red", icon: "triangle-alert" });
    expect(label).toMatchObject({ name: "Urgent", colour: "red", icon: "triangle-alert" });
    expect(await listLabels()).toEqual([label]);
  });

  it("updates a label", async () => {
    const label = await createLabel({ name: "Urgent", colour: "red", icon: "triangle-alert" });
    const updated = await updateLabel(label.id, { colour: "orange" });
    expect(updated.colour).toBe("orange");
    expect(updated.name).toBe("Urgent");
  });

  it("rejects updating a label that does not exist", async () => {
    await expect(updateLabel(999, { name: "x" })).rejects.toBeInstanceOf(LabelNotFoundError);
  });

  it("deleting a label removes it and its task associations, but never touches GT data", async () => {
    const label = await createLabel({ name: "Urgent", colour: "red", icon: "triangle-alert" });
    await setTaskLabels("task-1", [label.id]);

    await deleteLabel(label.id);

    expect(await listLabels()).toEqual([]);
    const map = await getLabelsForTasks(["task-1"]);
    expect(map.get("task-1") ?? []).toEqual([]);
    const [task] = await db.select().from(tasks).where(eq(tasks.gtId, "task-1"));
    expect(task).toBeDefined();
  });

  it("rejects deleting a label that does not exist", async () => {
    await expect(deleteLabel(999)).rejects.toBeInstanceOf(LabelNotFoundError);
  });
});

describe("setTaskLabels / getLabelsForTasks", () => {
  it("attaches labels to a task and batches lookups for multiple tasks", async () => {
    const urgent = await createLabel({ name: "Urgent", colour: "red", icon: "triangle-alert" });
    const personal = await createLabel({ name: "Personal", colour: "green", icon: "house" });

    await setTaskLabels("task-1", [urgent.id, personal.id]);

    const map = await getLabelsForTasks(["task-1", "task-2"]);
    expect(map.get("task-1")).toEqual(expect.arrayContaining([urgent, personal]));
    expect(map.get("task-2") ?? []).toEqual([]);
  });

  it("replaces the full label set rather than appending", async () => {
    const urgent = await createLabel({ name: "Urgent", colour: "red", icon: "triangle-alert" });
    const personal = await createLabel({ name: "Personal", colour: "green", icon: "house" });

    await setTaskLabels("task-1", [urgent.id]);
    const result = await setTaskLabels("task-1", [personal.id]);

    expect(result).toEqual([personal]);
  });

  it("cascade-deletes label associations when the task's GT cache row is deleted (plan.md section 2.2)", async () => {
    const urgent = await createLabel({ name: "Urgent", colour: "red", icon: "triangle-alert" });
    await setTaskLabels("task-1", [urgent.id]);

    await db.delete(tasks).where(eq(tasks.gtId, "task-1"));

    const map = await getLabelsForTasks(["task-1"]);
    expect(map.get("task-1") ?? []).toEqual([]);
    expect(await listLabels()).toEqual([urgent]);
  });
});
