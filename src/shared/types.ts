import type { LabelColour, LabelIconName } from "./labels.js";

// Types shared between src/client and src/server for the T API (plan.md section 30). The
// server never exposes raw Google Tasks or internal row shapes across this boundary.

export interface TaskListDTO {
  gtId: string;
  title: string;
}

export interface LabelDTO {
  id: number;
  name: string;
  colour: LabelColour;
  icon: LabelIconName;
}

export interface TaskDTO {
  gtId: string;
  gtTaskListId: string;
  gtParentId: string | null;
  title: string;
  notes: string | null;
  status: "needsAction" | "completed";
  due: string | null;
  completedAt: string | null;
  position: string;
  labels: LabelDTO[];
}

export type BuiltInView = "all" | "completed" | "next" | "overdue";

export type ApplicationStatus = "starting" | "authenticating" | "syncing" | "ready" | "error";

export interface SyncStateDTO {
  status: "idle" | "syncing" | "success" | "error";
  lastStartedAt: string | null;
  lastCompletedAt: string | null;
  lastError: string | null;
}

export interface StatusResponse {
  status: ApplicationStatus;
  authenticated: boolean;
  sync: SyncStateDTO;
}
