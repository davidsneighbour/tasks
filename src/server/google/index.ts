import { listTaskLists } from "./task-lists.js";
import { completeTask, createTask, deleteTask, listTasks, moveTask, reopenTask, updateTask } from "./tasks.js";

export { GoogleApiError, httpStatusForGoogleApiError, type GoogleApiErrorKind } from "./client.js";
export { MissingGoogleCredentialsError } from "./auth.js";
export type { GoogleTaskList } from "./task-lists.js";
export type { CreateTaskInput, GoogleTask, MoveTaskOptions, UpdateTaskInput } from "./tasks.js";

// Everything Google-specific stays behind this interface (plan.md section 47); route handlers
// and the sync service depend on this shape, never on the Google Tasks REST API directly.
export const googleTasksClient = {
  listTaskLists,
  listTasks,
  createTask,
  updateTask,
  completeTask,
  reopenTask,
  deleteTask,
  moveTask,
};

export type GoogleTasksClient = typeof googleTasksClient;
