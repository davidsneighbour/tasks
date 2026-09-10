import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/sqlite-proxy/migrator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db, sqlite } from "../db/client.js";
import { defaultTaskList, taskListOrder, taskLists } from "../db/schema.js";
import { getConfiguredDefaultTaskListGtId, getEffectiveDefaultTaskList, setDefaultTaskList } from "./default-task-list-service.js";
import { setTaskListOrder } from "./task-list-order-service.js";

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
  await db.delete(defaultTaskList);
  await db.delete(taskListOrder);
  await db.delete(taskLists);
  for (const [gtId, title] of [
    ["list-x", "Xylophone"],
    ["list-a", "Apple"],
  ] as const) {
    await db.insert(taskLists).values({ gtId, title, gtUpdatedAt: "2024-01-01T00:00:00.000Z", syncedAt: "2024-01-01T00:00:00.000Z" });
  }
});

describe("getConfiguredDefaultTaskListGtId / setDefaultTaskList", () => {
  it("returns null when nothing is configured", async () => {
    expect(await getConfiguredDefaultTaskListGtId()).toBeNull();
  });

  it("stores and reads a configured default", async () => {
    await setDefaultTaskList("list-x");
    expect(await getConfiguredDefaultTaskListGtId()).toBe("list-x");
  });

  it("overwrites the singleton row rather than accumulating rows", async () => {
    await setDefaultTaskList("list-x");
    await setDefaultTaskList("list-a");
    expect(await getConfiguredDefaultTaskListGtId()).toBe("list-a");

    const rows = await db.select().from(defaultTaskList);
    expect(rows).toHaveLength(1);
  });

  it("can be cleared back to null", async () => {
    await setDefaultTaskList("list-x");
    await setDefaultTaskList(null);
    expect(await getConfiguredDefaultTaskListGtId()).toBeNull();
  });
});

describe("getEffectiveDefaultTaskList", () => {
  it("falls back to the first list in alphabetical order when nothing is configured or positioned", async () => {
    expect(await getEffectiveDefaultTaskList()).toEqual({ gtId: "list-a", title: "Apple" });
  });

  it("falls back to the first list in sidebar order when nothing is configured", async () => {
    await setTaskListOrder(["list-x", "list-a"]);
    expect(await getEffectiveDefaultTaskList()).toEqual({ gtId: "list-x", title: "Xylophone" });
  });

  it("prefers the configured default over sidebar order", async () => {
    await setTaskListOrder(["list-x", "list-a"]);
    await setDefaultTaskList("list-a");
    expect(await getEffectiveDefaultTaskList()).toEqual({ gtId: "list-a", title: "Apple" });
  });

  it("falls back when the configured default list is later deleted (ON DELETE SET NULL)", async () => {
    await setDefaultTaskList("list-x");
    await db.delete(taskLists).where(eq(taskLists.gtId, "list-x"));

    expect(await getConfiguredDefaultTaskListGtId()).toBeNull();
    expect(await getEffectiveDefaultTaskList()).toEqual({ gtId: "list-a", title: "Apple" });
  });

  it("returns null when there are no task lists at all", async () => {
    await db.delete(taskLists);
    expect(await getEffectiveDefaultTaskList()).toBeNull();
  });
});
