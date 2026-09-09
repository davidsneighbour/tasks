import { CheckCircle2, Circle } from "lucide-react";
import type { TaskDTO } from "@shared/types";
import { cn } from "@client/lib/utils";
import { LabelBadge } from "@client/features/labels/LabelBadge";

function formatDue(due: string | null): string | null {
  if (!due) return null;
  return new Date(due).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export interface TaskRowProps {
  task: TaskDTO;
  selected: boolean;
  onSelect: () => void;
  onToggleComplete: () => void;
  toggling: boolean;
}

// The checkbox and the row body are separate buttons: clicking the checkbox completes/reopens
// the task (Phase 5, remote-first via the server), clicking the row opens the read-only
// detail panel from Phase 4.
export function TaskRow({ task, selected, onSelect, onToggleComplete, toggling }: TaskRowProps) {
  const due = formatDue(task.due);
  const isCompleted = task.status === "completed";

  return (
    <div className={cn("flex items-start gap-3 rounded-md px-3 py-2 text-sm", selected ? "bg-muted" : "hover:bg-muted")}>
      <button
        type="button"
        onClick={onToggleComplete}
        disabled={toggling}
        aria-label={isCompleted ? "Mark as not completed" : "Mark as completed"}
        className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        {isCompleted ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
      </button>
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 flex-col items-start text-left">
        <span className={cn("truncate", isCompleted && "text-muted-foreground line-through")}>{task.title}</span>
        {due && <span className="text-xs text-muted-foreground">{due}</span>}
        {task.labels.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-1">
            {task.labels.map((label) => (
              <LabelBadge key={label.id} label={label} />
            ))}
          </span>
        )}
      </button>
    </div>
  );
}
