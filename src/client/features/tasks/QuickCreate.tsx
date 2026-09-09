import { useState, type FormEvent } from "react";
import { createTask } from "@client/lib/api";

export interface QuickCreateProps {
  taskListGtId: string;
  onCreated: () => void;
}

// Minimum viable quick create (plan.md section 38): title only, Enter to submit.
export function QuickCreate({ taskListGtId, onCreated }: QuickCreateProps) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || submitting) return;

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
      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Add a task and press Enter…"
        disabled={submitting}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
      />
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
