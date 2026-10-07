import { Check, X } from "lucide-react";
import { useState } from "react";
import { updateTask, type UpdateTaskInput } from "@client/lib/api";
import { Button } from "@client/components/ui/button";
import { Textarea } from "@client/components/ui/textarea";
import { cn } from "@client/lib/utils";

export interface EditableTextFieldProps {
  taskGtId: string;
  field: "title" | "notes";
  value: string;
  placeholder: string;
  onChange: () => void;
}

// Title and notes both go through the same remote-first PATCH; only the
// field name and whether an empty value is allowed differ.
export function EditableTextField({ taskGtId, field, value, placeholder, onChange }: EditableTextFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setDraft(value);
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError(null);
  }

  async function save() {
    const trimmed = draft.trim();
    if (field === "title" && !trimmed) {
      setError("Title cannot be empty.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const input: UpdateTaskInput = field === "title" ? { title: trimmed } : { notes: trimmed };
      await updateTask(taskGtId, input);
      onChange();
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={startEditing}
        className={cn("block w-full whitespace-pre-wrap text-left hover:underline", !value && "text-muted-foreground")}
      >
        {value || placeholder}
      </button>
    );
  }

  return (
    <div>
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={field === "title" ? 2 : 4}
        disabled={saving}
        autoFocus
      />
      <div className="mt-1 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={cancel}
          disabled={saving}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
        >
          <X className="size-3.5" />
          Cancel
        </button>
        <Button type="button" size="icon" className="size-7" onClick={save} disabled={saving} aria-label={`Save ${field}`}>
          <Check className="size-4" />
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
