import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/sqlite-proxy/migrator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db, sqlite } from "../db/client.js";
import { taskLists, taskStars, tasks } from "../db/schema.js";
import { getStarsForTasks, removeTaskStar, setTaskStar } from "./star-service.js";

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
  await db.delete(taskStars);
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

describe("setTaskStar / removeTaskStar / getStarsForTasks", () => {
  it("sets a star, purely locally", async () => {
    await setTaskStar("task-1", "yellow-star");
    const map = await getStarsForTasks(["task-1"]);
    expect(map.get("task-1")).toBe("yellow-star");
  });

  it("replaces rather than allowing more than one star at a time (plan.md section 10)", async () => {
    await setTaskStar("task-1", "yellow-star");
    await setTaskStar("task-1", "red-star");

    const rows = await db.select().from(taskStars).where(eq(taskStars.taskGtId, "task-1"));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.star).toBe("red-star");
  });

  it("removes a star", async () => {
    await setTaskStar("task-1", "yellow-star");
    await removeTaskStar("task-1");

    const map = await getStarsForTasks(["task-1"]);
    expect(map.has("task-1")).toBe(false);
  });

  it("cascade-deletes the star when the task's GT cache row is deleted (plan.md section 2.2)", async () => {
    await setTaskStar("task-1", "yellow-star");
    await db.delete(tasks).where(eq(tasks.gtId, "task-1"));

    const rows = await db.select().from(taskStars);
    expect(rows).toHaveLength(0);
  });

  it("returns no entry for a task with no star", async () => {
    const map = await getStarsForTasks(["task-1"]);
    expect(map.has("task-1")).toBe(false);
  });
});
