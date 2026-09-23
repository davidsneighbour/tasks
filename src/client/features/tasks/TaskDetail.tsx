import type { TaskDTO } from "@shared/types";
import { Button } from "@client/components/ui/button";
import { DueDatePicker } from "@client/features/tasks/DueDatePicker";
import { EditableTextField } from "@client/features/tasks/EditableTextField";
import { LabelPicker } from "@client/features/labels/LabelPicker";
import { StarPicker } from "@client/features/stars/StarPicker";

export interface TaskDetailProps {
  task: TaskDTO;
  onClose: () => void;
  onDelete: () => void;
  onChanged: () => void;
  deleting: boolean;
}

// Status (via the row checkbox), title, notes, due date, labels, and star are all editable
// here, each following the same remote-first pattern (plan.md sections 23-26).
export function TaskDetail({ task, onClose, onDelete, onChanged, deleting }: TaskDetailProps) {
  return (
    <aside className="shrink-0 border-t border-border p-4 md:h-full md:min-h-0 md:w-80 md:overflow-y-auto md:border-l md:border-t-0">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Task details</h2>
        <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
          Close
        </button>
      </div>

      <dl className="mt-4 flex flex-col gap-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase text-muted-foreground">Title</dt>
          <dd>
            <EditableTextField taskGtId={task.gtId} field="title" value={task.title} placeholder="Untitled task" onChange={onChanged} />
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase text-muted-foreground">Notes</dt>
          <dd>
            <EditableTextField taskGtId={task.gtId} field="notes" value={task.notes ?? ""} placeholder="No notes" onChange={onChanged} />
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase text-muted-foreground">Due</dt>
          <dd>
            <DueDatePicker taskGtId={task.gtId} currentDue={task.due} onChange={onChanged} />
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase text-muted-foreground">Status</dt>
          <dd>{task.status === "completed" ? "Completed" : "Open"}</dd>
        </div>

        <div>
          <dt className="mb-1 text-xs font-medium uppercase text-muted-foreground">Star</dt>
          <dd>
            <StarPicker taskGtId={task.gtId} currentStar={task.star} onChange={onChanged} />
          </dd>
        </div>

        <div>
          <dt className="mb-1 text-xs font-medium uppercase text-muted-foreground">Labels</dt>
          <dd>
            <LabelPicker taskGtId={task.gtId} currentLabels={task.labels} onChange={onChanged} />
          </dd>
        </div>
      </dl>

      <Button variant="ghost" size="sm" className="mt-4 text-red-600 hover:bg-red-50 dark:text-red-400" onClick={onDelete} disabled={deleting}>
        {deleting ? "Deleting…" : "Delete task"}
      </Button>
    </aside>
  );
}
