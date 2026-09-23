import type { TaskDTO } from "@shared/types";
import { Button } from "@client/components/ui/button";
import { DueDatePicker } from "@client/features/tasks/DueDatePicker";
import { LabelPicker } from "@client/features/labels/LabelPicker";
import { StarPicker } from "@client/features/stars/StarPicker";

export interface TaskDetailProps {
  task: TaskDTO;
  onClose: () => void;
  onDelete: () => void;
  onChanged: () => void;
  deleting: boolean;
}

// Title/notes editing is not wired yet - status (via the row checkbox), due date, labels,
// star, and delete are. The rest can follow the same remote-first pattern later without
// changing this panel's shape.
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
          <dd>{task.title}</dd>
        </div>

        {task.notes && (
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Notes</dt>
            <dd className="whitespace-pre-wrap">{task.notes}</dd>
          </div>
        )}

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
