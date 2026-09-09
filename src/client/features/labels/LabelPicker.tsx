import { useState } from "react";
import type { LabelDTO } from "@shared/types";
import { getLabels, setTaskLabels } from "@client/lib/api";
import { useFetch } from "@client/lib/use-fetch";
import { cn } from "@client/lib/utils";
import { LabelBadge } from "./LabelBadge";

export interface LabelPickerProps {
  taskGtId: string;
  currentLabels: LabelDTO[];
  onChange: () => void;
}

// Local-only, immediate (plan.md section 26): no GT round trip, just a SQLite write.
export function LabelPicker({ taskGtId, currentLabels, onChange }: LabelPickerProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const labelsState = useFetch(() => getLabels(), [open]);

  const currentIds = new Set(currentLabels.map((label) => label.id));

  async function toggle(labelId: number) {
    setSaving(true);
    setError(null);
    const nextIds = currentIds.has(labelId)
      ? currentLabels.filter((label) => label.id !== labelId).map((label) => label.id)
      : [...currentIds, labelId];

    try {
      await setTaskLabels(taskGtId, nextIds);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1">
        {currentLabels.map((label) => (
          <LabelBadge key={label.id} label={label} />
        ))}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
        >
          {open ? "Done" : "Edit labels"}
        </button>
      </div>

      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {open && (
        <div className="mt-2 flex flex-col gap-1 rounded-md border border-border p-2">
          {labelsState.status === "loading" && <p className="text-xs text-muted-foreground">Loading…</p>}
          {labelsState.status === "error" && <p className="text-xs text-red-600 dark:text-red-400">{labelsState.message}</p>}
          {labelsState.status === "ready" && labelsState.data.labels.length === 0 && (
            <p className="text-xs text-muted-foreground">No labels yet. Create one in Manage labels.</p>
          )}
          {labelsState.status === "ready" &&
            labelsState.data.labels.map((label) => (
              <label
                key={label.id}
                className={cn("flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs hover:bg-muted", saving && "opacity-50")}
              >
                <input
                  type="checkbox"
                  checked={currentIds.has(label.id)}
                  disabled={saving}
                  onChange={() => toggle(label.id)}
                />
                <LabelBadge label={label} />
              </label>
            ))}
        </div>
      )}
    </div>
  );
}
