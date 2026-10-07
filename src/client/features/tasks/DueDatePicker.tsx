import { Check, X } from "lucide-react";
import { useState } from "react";
import { updateTask } from "@client/lib/api";
import { Button } from "@client/components/ui/button";
import { Calendar } from "@client/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@client/components/ui/popover";
import { dueDateString, formatDueDate } from "@client/lib/due-date";

export interface DueDatePickerProps {
  taskGtId: string;
  currentDue: string | null;
  onChange: () => void;
}

// GT due dates carry no time component, so the picker is date-only.
function parseDueDate(due: string | null): Date | undefined {
  const dateString = dueDateString(due);
  return dateString ? new Date(`${dateString}T00:00:00`) : undefined;
}

// Sent as UTC midnight; GT discards any time portion regardless (verified against the
// Tasks API reference - the API cannot read or write a time of day for a task).
function toDueValue(date: Date): string {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();
}

export function DueDatePicker({ taskGtId, currentDue, onChange }: DueDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date | undefined>(() => parseDueDate(currentDue));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openPicker() {
    setSelected(parseDueDate(currentDue));
    setError(null);
    setOpen(true);
  }

  async function save(due: string | null) {
    setSaving(true);
    setError(null);
    try {
      await updateTask(taskGtId, { due });
      onChange();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Popover open={open} onOpenChange={(next) => (next ? openPicker() : setOpen(false))}>
        <PopoverTrigger asChild>
          <button type="button" className="text-left hover:underline">
            {formatDueDate(currentDue)}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={selected} {...(selected ? { defaultMonth: selected } : {})} onSelect={setSelected} autoFocus />
          <div className="flex items-center justify-between gap-2 border-t border-border p-2">
            <button
              type="button"
              onClick={() => save(null)}
              disabled={saving}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              <X className="size-3.5" />
              No due date
            </button>
            <Button
              type="button"
              size="icon"
              className="size-7"
              onClick={() => selected && save(toDueValue(selected))}
              disabled={saving || !selected}
              aria-label="Save due date"
            >
              <Check className="size-4" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
