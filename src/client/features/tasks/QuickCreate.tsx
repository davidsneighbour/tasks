import { useEffect, useState, type FormEvent } from "react";
import { createTask, getTaskLists } from "@client/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@client/components/ui/select";

export interface QuickCreateProps {
  // Fixed when quick-create is shown on a single task list's own page; otherwise the
  // list is chosen from the task-list picker below, defaulting to the configured default list.
  taskListGtId?: string;
  onCreated: () => void;
}

// Minimum viable quick create: title only, Enter to submit.
export function QuickCreate({ taskListGtId: fixedTaskListGtId, onCreated }: QuickCreateProps) {
  const [title, setTitle] = useState("");
  const [taskLists, setTaskLists] = useState<{ gtId: string; title: string }[]>([]);
  const [selectedTaskListGtId, setSelectedTaskListGtId] = useState<string | null>(fixedTaskListGtId ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fixedTaskListGtId) return;
    let cancelled = false;
    getTaskLists().then(({ taskLists: lists, defaultTaskListGtId }) => {
      if (cancelled) return;
      setTaskLists(lists);
      setSelectedTaskListGtId((current) => current ?? defaultTaskListGtId ?? lists[0]?.gtId ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [fixedTaskListGtId]);

  const taskListGtId = fixedTaskListGtId ?? selectedTaskListGtId;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !taskListGtId || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await createTask({ taskListGtId, title: trimmed });
      setTitle("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex gap-2">
        {!fixedTaskListGtId && taskLists.length > 0 && (
          <Select
            {...(selectedTaskListGtId ? { value: selectedTaskListGtId } : {})}
            onValueChange={setSelectedTaskListGtId}
            disabled={submitting}
          >
            <SelectTrigger className="w-40 shrink-0">
              <SelectValue placeholder="Task list" />
            </SelectTrigger>
            <SelectContent>
              {taskLists.map((list) => (
                <SelectItem key={list.gtId} value={list.gtId}>
                  {list.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a task and press Enter…"
          disabled={submitting}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
