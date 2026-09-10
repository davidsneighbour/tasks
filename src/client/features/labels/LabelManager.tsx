import { useState } from "react";
import { LABEL_COLOURS, LABEL_ICON_NAMES, type LabelColour, type LabelIconName } from "@shared/labels";
import type { LabelDTO } from "@shared/types";
import { Button } from "@client/components/ui/button";
import { createLabel, deleteLabel, getLabels, updateLabel } from "@client/lib/api";
import { notifyLabelsChanged } from "@client/lib/label-events";
import { LABEL_COLOUR_CLASSES, LABEL_SWATCH_CLASSES } from "@client/lib/label-colors";
import { LABEL_ICON_COMPONENTS } from "@client/lib/label-icons";
import { useFetch } from "@client/lib/use-fetch";
import { cn } from "@client/lib/utils";

function LabelForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Pick<LabelDTO, "name" | "colour" | "icon">;
  onSubmit: (input: { name: string; colour: LabelColour; icon: LabelIconName }) => void;
  onCancel?: () => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [colour, setColour] = useState<LabelColour>(initial?.colour ?? "gray");
  const [icon, setIcon] = useState<LabelIconName>(initial?.icon ?? "tag");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim()) onSubmit({ name: name.trim(), colour, icon });
      }}
      className="flex flex-col gap-3 rounded-md border border-border p-3"
    >
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Label name"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
      />

      <div className="flex flex-wrap gap-1">
        {LABEL_COLOURS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setColour(option)}
            aria-label={option}
            className={cn(
              "size-6 rounded-full ring-offset-2 ring-offset-background",
              LABEL_SWATCH_CLASSES[option],
              colour === option && "ring-2 ring-primary",
            )}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {LABEL_ICON_NAMES.map((option) => {
          const Icon = LABEL_ICON_COMPONENTS[option];
          return (
            <button
              key={option}
              type="button"
              onClick={() => setIcon(option)}
              aria-label={option}
              className={cn(
                "flex size-8 items-center justify-center rounded-md border border-border",
                icon === option ? "bg-muted" : "hover:bg-muted",
              )}
            >
              <Icon className="size-4" />
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting || !name.trim()}>
          {submitting ? "Saving…" : "Save"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function LabelManager() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const state = useFetch(() => getLabels(), [refreshKey]);

  function refresh() {
    setRefreshKey((key) => key + 1);
    notifyLabelsChanged();
  }

  async function handleCreate(input: { name: string; colour: LabelColour; icon: LabelIconName }) {
    setSubmitting(true);
    setError(null);
    try {
      await createLabel(input);
      setCreating(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(id: number, input: { name: string; colour: LabelColour; icon: LabelIconName }) {
    setSubmitting(true);
    setError(null);
    try {
      await updateLabel(id, input);
      setEditingId(null);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    try {
      await deleteLabel(id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Labels</h1>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            New label
          </Button>
        )}
      </div>

      {error && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {creating && (
        <div className="mb-4">
          <LabelForm onSubmit={handleCreate} onCancel={() => setCreating(false)} submitting={submitting} />
        </div>
      )}

      {state.status === "loading" && <p className="text-sm text-muted-foreground">Loading…</p>}
      {state.status === "error" && <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>}
      {state.status === "ready" && state.data.labels.length === 0 && !creating && (
        <p className="text-sm text-muted-foreground">No labels yet.</p>
      )}

      <div className="flex flex-col gap-2">
        {state.status === "ready" &&
          state.data.labels.map((label) =>
            editingId === label.id ? (
              <LabelForm
                key={label.id}
                initial={label}
                onSubmit={(input) => handleUpdate(label.id, input)}
                onCancel={() => setEditingId(null)}
                submitting={submitting}
              />
            ) : (
              <div key={label.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", LABEL_COLOUR_CLASSES[label.colour])}>
                  {label.name}
                </span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingId(label.id)} className="text-xs text-muted-foreground hover:text-foreground">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(label.id)}
                    className="text-xs text-red-600 hover:underline dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ),
          )}
      </div>
    </div>
  );
}
