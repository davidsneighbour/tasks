import { migrate } from "drizzle-orm/sqlite-proxy/migrator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db, sqlite } from "../db/client.js";
import { taskLists, tasks } from "../db/schema.js";
import { addDays, todayDateString } from "./date.js";
import { getDeadTasks } from "./dead.js";

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
  await db.delete(tasks);
  await db.delete(taskLists);
  await db.insert(taskLists).values({
    gtId: "list-1",
    title: "Personal",
    gtUpdatedAt: "2024-01-01T00:00:00.000Z",
    syncedAt: "2024-01-01T00:00:00.000Z",
  });
});

interface TaskOverrides {
  gtId: string;
  status?: "needsAction" | "completed";
  due?: string | null;
}

async function insertTask({ gtId, status = "needsAction", due = null }: TaskOverrides) {
  await db.insert(tasks).values({
    gtId,
    gtTaskListId: "list-1",
    title: gtId,
    status,
    due,
    position: "00000000000000000000",
    etag: "etag-1",
    gtUpdatedAt: "2024-01-01T00:00:00.000Z",
    syncedAt: "2024-01-01T00:00:00.000Z",
  });
}

describe("getDeadTasks", () => {
  it("includes incomplete tasks overdue by more than the threshold", async () => {
    await insertTask({ gtId: "long-overdue", due: `${addDays(todayDateString(), -30)}T00:00:00.000Z` });

    const result = await getDeadTasks(28);

    expect(result.map((task) => task.gtId)).toEqual(["long-overdue"]);
  });

  it("excludes incomplete tasks overdue by less than the threshold", async () => {
    await insertTask({ gtId: "recently-overdue", due: `${addDays(todayDateString(), -10)}T00:00:00.000Z` });

    const result = await getDeadTasks(28);

    expect(result).toHaveLength(0);
  });

  it("excludes tasks without a due date", async () => {
    await insertTask({ gtId: "no-due-date", due: null });

    const result = await getDeadTasks(28);

    expect(result).toHaveLength(0);
  });

  it("excludes completed tasks regardless of how overdue they are", async () => {
    await insertTask({
      gtId: "completed-long-ago",
      status: "completed",
      due: `${addDays(todayDateString(), -60)}T00:00:00.000Z`,
    });

    const result = await getDeadTasks(28);

    expect(result).toHaveLength(0);
  });

  it("respects a custom threshold", async () => {
    await insertTask({ gtId: "overdue-10-days", due: `${addDays(todayDateString(), -10)}T00:00:00.000Z` });

    const result = await getDeadTasks(7);

    expect(result.map((task) => task.gtId)).toEqual(["overdue-10-days"]);
  });
});
