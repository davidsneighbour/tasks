import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/sqlite-proxy/migrator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db, sqlite } from "../db/client.js";
import { taskListOrder, taskLists } from "../db/schema.js";
import { getTaskListPositions, setTaskListOrder } from "./task-list-order-service.js";

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
  await db.delete(taskListOrder);
  await db.delete(taskLists);
  for (const gtId of ["list-a", "list-b", "list-c"]) {
    await db.insert(taskLists).values({ gtId, title: gtId, gtUpdatedAt: "2024-01-01T00:00:00.000Z", syncedAt: "2024-01-01T00:00:00.000Z" });
  }
});

describe("setTaskListOrder / getTaskListPositions", () => {
  it("returns no positions when nothing has been ordered yet", async () => {
    expect(await getTaskListPositions()).toEqual(new Map());
  });

  it("stores a position matching each list's index", async () => {
    await setTaskListOrder(["list-c", "list-a", "list-b"]);

    expect(await getTaskListPositions()).toEqual(
      new Map([
        ["list-c", 0],
        ["list-a", 1],
        ["list-b", 2],
      ]),
    );
  });

  it("overwrites a previously stored order rather than accumulating rows", async () => {
    await setTaskListOrder(["list-a", "list-b", "list-c"]);
    await setTaskListOrder(["list-c", "list-b", "list-a"]);

    expect(await getTaskListPositions()).toEqual(
      new Map([
        ["list-c", 0],
        ["list-b", 1],
        ["list-a", 2],
      ]),
    );
  });

  it("removes its stored position when the task list is deleted (cascade)", async () => {
    await setTaskListOrder(["list-a"]);
    await db.delete(taskLists).where(eq(taskLists.gtId, "list-a"));

    expect(await getTaskListPositions()).toEqual(new Map());
  });
});
