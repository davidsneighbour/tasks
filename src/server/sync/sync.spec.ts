import { migrate } from "drizzle-orm/sqlite-proxy/migrator";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../google/index.js", () => ({
  googleTasksClient: {
    listTaskLists: vi.fn(),
    listTasks: vi.fn(),
  },
}));

import { db, sqlite } from "../db/client.js";
import { taskLists, tasks } from "../db/schema.js";
import { googleTasksClient } from "../google/index.js";
import { getSyncState, runSync } from "./sync.js";

beforeAll(async () => {
  await migrate(
    db,
    async (queries) => {
      for (const query of queries) sqlite.exec(query);
    },
    { migrationsFolder: "./drizzle" },
  );
});

describe("runSync", () => {
  it("performs a full reconciliation: remote data is inserted and the sync state records success", async () => {
    vi.mocked(googleTasksClient.listTaskLists).mockResolvedValue([
      { id: "list-1", title: "Personal", updated: "2024-01-01T00:00:00.000Z" },
    ]);
    vi.mocked(googleTasksClient.listTasks).mockResolvedValue([
      {
        id: "task-1",
        title: "Buy milk",
        status: "needsAction",
        position: "0",
        etag: "etag-1",
        updated: "2024-01-01T00:00:00.000Z",
      },
    ]);

    const result = await runSync();

    expect(result).toMatchObject({ status: "success", listsAdded: 1, tasksAdded: 1 });
    expect(await getSyncState()).toMatchObject({ status: "success" });
  });

  it("removes local records once GT no longer reports them (plan.md section 18)", async () => {
    vi.mocked(googleTasksClient.listTaskLists).mockResolvedValue([]);
    vi.mocked(googleTasksClient.listTasks).mockResolvedValue([]);

    const result = await runSync();

    expect(result).toMatchObject({ status: "success", listsRemoved: 1, tasksRemoved: 1 });
    expect(await db.select().from(taskLists)).toHaveLength(0);
    expect(await db.select().from(tasks)).toHaveLength(0);
  });

  it("never deletes local records when the remote fetch fails partway through (plan.md section 44)", async () => {
    vi.mocked(googleTasksClient.listTaskLists).mockResolvedValue([
      { id: "list-1", title: "Personal", updated: "2024-01-01T00:00:00.000Z" },
    ]);
    vi.mocked(googleTasksClient.listTasks).mockResolvedValue([
      {
        id: "task-1",
        title: "Buy milk",
        status: "needsAction",
        position: "0",
        etag: "etag-1",
        updated: "2024-01-01T00:00:00.000Z",
      },
    ]);
    await runSync();

    vi.mocked(googleTasksClient.listTasks).mockRejectedValueOnce(new Error("network blip"));

    const result = await runSync();

    expect(result.status).toBe("error");
    expect(await db.select().from(taskLists)).toHaveLength(1);
    expect(await db.select().from(tasks)).toHaveLength(1);
    expect(await getSyncState()).toMatchObject({ status: "error" });
  });
});
