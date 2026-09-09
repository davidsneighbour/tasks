import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// GT cache tables (plan.md section 8): local mirror of remote entities only. T-specific
// extensions (labels, stars, ...) live in their own tables, introduced in later phases,
// keyed to task_gt_id so they cascade-delete when the GT cache entry for a task disappears.

export const taskLists = sqliteTable("task_lists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gtId: text("gt_id").notNull().unique(),
  title: text("title").notNull(),
  gtUpdatedAt: text("gt_updated_at").notNull(),
  syncedAt: text("synced_at").notNull(),
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gtId: text("gt_id").notNull().unique(),
  gtTaskListId: text("gt_task_list_id")
    .notNull()
    .references(() => taskLists.gtId, { onDelete: "cascade" }),
  // No FK constraint: the parent may be upserted in the same batch, in either order.
  gtParentId: text("gt_parent_id"),
  title: text("title").notNull(),
  notes: text("notes"),
  status: text("status", { enum: ["needsAction", "completed"] }).notNull(),
  due: text("due"),
  completedAt: text("completed_at"),
  position: text("position").notNull(),
  etag: text("etag").notNull(),
  gtUpdatedAt: text("gt_updated_at").notNull(),
  syncedAt: text("synced_at").notNull(),
});

// Singleton row (id = 1) tracking the last full reconciliation (plan.md section 46).
export const syncState = sqliteTable("sync_state", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  status: text("status", { enum: ["idle", "syncing", "success", "error"] })
    .notNull()
    .default("idle"),
  lastStartedAt: text("last_started_at"),
  lastCompletedAt: text("last_completed_at"),
  lastError: text("last_error"),
});
