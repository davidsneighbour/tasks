import { describe, expect, it } from "vitest";
import {
  diffTaskLists,
  diffTasks,
  mapGoogleTask,
  type LocalTaskListRecord,
  type LocalTaskRecord,
  type RemoteTaskListRecord,
  type RemoteTaskRecord,
} from "./reconciliation.js";

function remoteTask(overrides: Partial<RemoteTaskRecord> = {}): RemoteTaskRecord {
  return {
    gtId: "task-1",
    gtTaskListId: "list-1",
    gtParentId: null,
    title: "Buy milk",
    notes: null,
    status: "needsAction",
    due: null,
    completedAt: null,
    position: "00000000000000000000",
    etag: "etag-1",
    gtUpdatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function localTask(overrides: Partial<LocalTaskRecord> = {}): LocalTaskRecord {
  return { gtId: "task-1", etag: "etag-1", ...overrides };
}

function remoteList(overrides: Partial<RemoteTaskListRecord> = {}): RemoteTaskListRecord {
  return { gtId: "list-1", title: "Personal", gtUpdatedAt: "2024-01-01T00:00:00.000Z", ...overrides };
}

function localList(overrides: Partial<LocalTaskListRecord> = {}): LocalTaskListRecord {
  return { gtId: "list-1", title: "Personal", gtUpdatedAt: "2024-01-01T00:00:00.000Z", ...overrides };
}

describe("diffTaskLists", () => {
  it("inserts a list that exists remotely but not locally", () => {
    const diff = diffTaskLists([remoteList()], []);
    expect(diff.toInsert).toEqual([remoteList()]);
    expect(diff.toUpdate).toEqual([]);
    expect(diff.toDeleteGtIds).toEqual([]);
  });

  it("updates a list whose title changed remotely", () => {
    const diff = diffTaskLists([remoteList({ title: "Work" })], [localList({ title: "Personal" })]);
    expect(diff.toInsert).toEqual([]);
    expect(diff.toUpdate).toEqual([remoteList({ title: "Work" })]);
  });

  it("leaves an unchanged list alone", () => {
    const diff = diffTaskLists([remoteList()], [localList()]);
    expect(diff.toInsert).toEqual([]);
    expect(diff.toUpdate).toEqual([]);
    expect(diff.toDeleteGtIds).toEqual([]);
  });

  it("deletes a list that is local but no longer remote", () => {
    const diff = diffTaskLists([], [localList()]);
    expect(diff.toDeleteGtIds).toEqual(["list-1"]);
  });
});

describe("diffTasks", () => {
  it("inserts a task that exists remotely but not locally", () => {
    const diff = diffTasks([remoteTask()], []);
    expect(diff.toInsert).toEqual([remoteTask()]);
    expect(diff.toUpdate).toEqual([]);
    expect(diff.toDeleteGtIds).toEqual([]);
  });

  it("updates a task whose etag changed remotely (GT wins over the local cache)", () => {
    const diff = diffTasks([remoteTask({ etag: "etag-2", title: "Buy oat milk" })], [localTask({ etag: "etag-1" })]);
    expect(diff.toInsert).toEqual([]);
    expect(diff.toUpdate).toEqual([remoteTask({ etag: "etag-2", title: "Buy oat milk" })]);
    expect(diff.toDeleteGtIds).toEqual([]);
  });

  it("leaves a task with a matching etag alone", () => {
    const diff = diffTasks([remoteTask()], [localTask()]);
    expect(diff.toInsert).toEqual([]);
    expect(diff.toUpdate).toEqual([]);
  });

  it("deletes a local task that is absent from the remote result", () => {
    const diff = diffTasks([], [localTask()]);
    expect(diff.toDeleteGtIds).toEqual(["task-1"]);
  });

  it("never deletes based on a partial remote fetch: an empty remote list here would mean a caller bug, not this function's job to guess", () => {
    // diffTasks trusts its `remote` argument completely; the safety rule (plan.md section 44)
    // that a failed/partial fetch must never reach diffTasks lives in sync.ts's try/catch,
    // which never calls diffTasks unless every fetch above it succeeded.
    const diff = diffTasks([remoteTask()], [localTask(), localTask({ gtId: "task-2", etag: "etag-9" })]);
    expect(diff.toDeleteGtIds).toEqual(["task-2"]);
  });
});

describe("mapGoogleTask", () => {
  it("returns null for a task GT reports as deleted, so it is never upserted", () => {
    const mapped = mapGoogleTask("list-1", {
      id: "task-1",
      title: "Buy milk",
      status: "needsAction",
      position: "0",
      etag: "etag-1",
      updated: "2024-01-01T00:00:00.000Z",
      deleted: true,
    });
    expect(mapped).toBeNull();
  });

  it("maps a live task's GT-managed fields, defaulting absent optionals to null", () => {
    const mapped = mapGoogleTask("list-1", {
      id: "task-1",
      title: "Buy milk",
      status: "needsAction",
      position: "0",
      etag: "etag-1",
      updated: "2024-01-01T00:00:00.000Z",
    });
    expect(mapped).toEqual({
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
    });
  });
});
