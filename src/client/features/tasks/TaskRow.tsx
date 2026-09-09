import { CheckCircle2, Circle } from "lucide-react";
import type { TaskDTO } from "@shared/types";
import { cn } from "@client/lib/utils";

function formatDue(due: string | null): string | null {
  if (!due) return null;
  return new Date(due).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export interface TaskRowProps {
  task: TaskDTO;
  selected: boolean;
  onSelect: () => void;
}

// Read-only for Phase 4 (plan.md section 60): the checkbox reflects status but does not yet
// mutate anything - that is Phase 5's remote-first create/update/complete flow.
export function TaskRow({ task, selected, onSelect }: TaskRowProps) {
  const due = formatDue(task.due);
  const isCompleted = task.status === "completed";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm",
        selected ? "bg-muted" : "hover:bg-muted",
      )}
    >
      {isCompleted ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      ) : (
        <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      )}
      <span className="flex min-w-0 flex-col">
        <span className={cn("truncate", isCompleted && "text-muted-foreground line-through")}>{task.title}</span>
        {due && <span className="text-xs text-muted-foreground">{due}</span>}
      </span>
    </button>
  );
}
