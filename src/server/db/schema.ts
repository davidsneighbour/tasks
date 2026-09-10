import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { LABEL_COLOURS, LABEL_ICON_NAMES } from "../../shared/labels.js";
import { STAR_TYPES } from "../../shared/stars.js";

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

// T-specific extension (plan.md section 9): keyed to the immutable GT task id, not GT's own
// data. Deleting a label never touches GT; deleting a task's GT cache row cascades here.

export const labels = sqliteTable("labels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  colour: text("colour", { enum: LABEL_COLOURS }).notNull(),
  icon: text("icon", { enum: LABEL_ICON_NAMES }).notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const taskLabels = sqliteTable(
  "task_labels",
  {
    taskGtId: text("task_gt_id")
      .notNull()
      .references(() => tasks.gtId, { onDelete: "cascade" }),
    labelId: integer("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.taskGtId, table.labelId] })],
);

// One optional star per task (plan.md section 10) - a single row keyed directly by the GT
// task id, not several boolean columns. No row means no star.
export const taskStars = sqliteTable("task_stars", {
  taskGtId: text("task_gt_id")
    .primaryKey()
    .references(() => tasks.gtId, { onDelete: "cascade" }),
  star: text("star", { enum: STAR_TYPES }).notNull(),
  updatedAt: text("updated_at").notNull(),
});

// One optional custom sort position per task list (issue #18) - a single row keyed directly
// by the GT list id, matching task_stars. No row means "no custom position yet", so the API
// falls back to alphabetical order for that list. GT has no ordering field for task lists
// (unlike tasks' GT-owned `position`), so this is entirely T-owned.
export const taskListOrder = sqliteTable("task_list_order", {
  taskListGtId: text("task_list_gt_id")
    .primaryKey()
    .references(() => taskLists.gtId, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Singleton row (id = 1) holding the user's configured default task list (issue #20), used
// by quick-capture flows (e.g. the CLI in #17) when no list is given. A missing row, a null
// value, or a value referencing a list that no longer exists all mean "no configured default";
// callers fall back to the first list in task_list_order (or alphabetical).
export const defaultTaskList = sqliteTable("default_task_list", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskListGtId: text("task_list_gt_id").references(() => taskLists.gtId, { onDelete: "set null" }),
  updatedAt: text("updated_at").notNull(),
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
