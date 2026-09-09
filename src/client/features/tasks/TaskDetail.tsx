import type { TaskDTO } from "@shared/types";

export interface TaskDetailProps {
  task: TaskDTO;
  onClose: () => void;
}

// Read-only detail panel (plan.md section 37); field editing arrives with Phase 5's
// remote-first update flow.
export function TaskDetail({ task, onClose }: TaskDetailProps) {
  return (
    <aside className="w-80 shrink-0 border-l border-border p-4">
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
          <dd>{task.due ? new Date(task.due).toLocaleDateString() : "No due date"}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase text-muted-foreground">Status</dt>
          <dd>{task.status === "completed" ? "Completed" : "Open"}</dd>
        </div>
      </dl>
    </aside>
  );
}
