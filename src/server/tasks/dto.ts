import type { LabelDTO, TaskDTO } from "../../shared/types.js";

export interface TaskDTOSource {
  gtId: string;
  gtTaskListId: string;
  gtParentId: string | null;
  title: string;
  notes: string | null;
  status: "needsAction" | "completed";
  due: string | null;
  completedAt: string | null;
  position: string;
}

export function toTaskDTO(row: TaskDTOSource, labels: LabelDTO[] = []): TaskDTO {
  return {
    gtId: row.gtId,
    gtTaskListId: row.gtTaskListId,
    gtParentId: row.gtParentId,
    title: row.title,
    notes: row.notes,
    status: row.status,
    due: row.due,
    completedAt: row.completedAt,
    position: row.position,
    labels,
  };
}
