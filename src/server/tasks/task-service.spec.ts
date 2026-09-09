import { migrate } from "drizzle-orm/sqlite-proxy/migrator";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../google/index.js", () => ({
  googleTasksClient: {
    createTask: vi.fn(),
    updateTask: vi.fn(),
    completeTask: vi.fn(),
    reopenTask: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

import { eq } from "drizzle-orm";
import { db, sqlite } from "../db/client.js";
import { taskLists, tasks } from "../db/schema.js";
import { googleTasksClient } from "../google/index.js";
import { TaskNotFoundError, completeTask, createTask, deleteTask, reopenTask, updateTask } from "./task-service.js";

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
  await db.insert(taskLists).values({ gtId: "list-1", title: "Personal", gtUpdatedAt: "2024-01-01T00:00:00.000Z", syncedAt: "2024-01-01T00:00:00.000Z" });
  vi.mocked(googleTasksClient.createTask).mockReset();
  vi.mocked(googleTasksClient.updateTask).mockReset();
  vi.mocked(googleTasksClient.completeTask).mockReset();
  vi.mocked(googleTasksClient.reopenTask).mockReset();
  vi.mocked(googleTasksClient.deleteTask).mockReset();
});

interface GoogleTaskOverrides {
  id?: string;
  title?: string;
  status?: "needsAction" | "completed";
  etag?: string;
  updated?: string;
}

function googleTask(overrides: GoogleTaskOverrides = {}) {
  return {
    id: "task-1",
    title: "Buy milk",
    status: "needsAction" as const,
    position: "0",
    etag: "etag-1",
    updated: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("createTask", () => {
  it("writes the local cache only after GT confirms the task exists (plan.md section 22)", async () => {
    vi.mocked(googleTasksClient.createTask).mockResolvedValue(googleTask());

    const result = await createTask({ taskListGtId: "list-1", title: "Buy milk" });

    expect(result).toMatchObject({ gtId: "task-1", title: "Buy milk", status: "needsAction" });
    expect(await db.select().from(tasks).where(eq(tasks.gtId, "task-1"))).toHaveLength(1);
  });

  it("creates nothing locally when GT rejects the create", async () => {
    vi.mocked(googleTasksClient.createTask).mockRejectedValue(new Error("GT is down"));

    await expect(createTask({ taskListGtId: "list-1", title: "Buy milk" })).rejects.toThrow("GT is down");
    expect(await db.select().from(tasks)).toHaveLength(0);
  });
});

describe("updateTask, completeTask, reopenTask", () => {
  beforeEach(async () => {
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
      etag: "etag-1",
      gtUpdatedAt: "2024-01-01T00:00:00.000Z",
      syncedAt: "2024-01-01T00:00:00.000Z",
    });
  });

  it("resolves the task's list from the cache and updates from GT's response", async () => {
    vi.mocked(googleTasksClient.updateTask).mockResolvedValue(googleTask({ title: "Buy oat milk", etag: "etag-2" }));

    const result = await updateTask("task-1", { title: "Buy oat milk" });

    expect(googleTasksClient.updateTask).toHaveBeenCalledWith("list-1", "task-1", { title: "Buy oat milk" });
    expect(result.title).toBe("Buy oat milk");
  });

  it("leaves the local task untouched when GT rejects the update (plan.md section 23)", async () => {
    vi.mocked(googleTasksClient.updateTask).mockRejectedValue(new Error("network blip"));

    await expect(updateTask("task-1", { title: "Buy oat milk" })).rejects.toThrow("network blip");
    const [row] = await db.select().from(tasks).where(eq(tasks.gtId, "task-1"));
    expect(row?.title).toBe("Buy milk");
  });

  it("completes a task from GT's confirmed response", async () => {
    vi.mocked(googleTasksClient.completeTask).mockResolvedValue(
      googleTask({ status: "completed", updated: "2024-01-02T00:00:00.000Z", etag: "etag-2" }),
    );

    const result = await completeTask("task-1");
    expect(result.status).toBe("completed");
  });

  it("reopens a task from GT's confirmed response", async () => {
    vi.mocked(googleTasksClient.reopenTask).mockResolvedValue(googleTask({ status: "needsAction", etag: "etag-3" }));

    const result = await reopenTask("task-1");
    expect(result.status).toBe("needsAction");
  });

  it("rejects with TaskNotFoundError for a task absent from the cache", async () => {
    await expect(updateTask("does-not-exist", { title: "x" })).rejects.toBeInstanceOf(TaskNotFoundError);
    expect(googleTasksClient.updateTask).not.toHaveBeenCalled();
  });
});

describe("deleteTask", () => {
  beforeEach(async () => {
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
      etag: "etag-1",
      gtUpdatedAt: "2024-01-01T00:00:00.000Z",
      syncedAt: "2024-01-01T00:00:00.000Z",
    });
  });

  it("deletes the local task only after GT confirms", async () => {
    vi.mocked(googleTasksClient.deleteTask).mockResolvedValue(undefined);

    await deleteTask("task-1");

    expect(await db.select().from(tasks)).toHaveLength(0);
  });

  it("leaves the local task untouched when GT rejects the delete (plan.md section 25)", async () => {
    vi.mocked(googleTasksClient.deleteTask).mockRejectedValue(new Error("GT is down"));

    await expect(deleteTask("task-1")).rejects.toThrow("GT is down");
    expect(await db.select().from(tasks)).toHaveLength(1);
  });
});
