import { Star, X } from "lucide-react";
import { useState } from "react";
import { STAR_TYPES, type StarType } from "@shared/stars";
import { removeTaskStar, setTaskStar } from "@client/lib/api";
import { STAR_COLOUR_CLASSES, STAR_LABELS } from "@client/lib/star-colors";
import { cn } from "@client/lib/utils";

export interface StarPickerProps {
  taskGtId: string;
  currentStar: StarType | null;
  onChange: () => void;
}

// A task has no star or exactly one star (plan.md section 10) - immediate, local only
// (section 26), no GT round trip.
export function StarPicker({ taskGtId, currentStar, onChange }: StarPickerProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(star: StarType) {
    if (star === currentStar) return;
    setSaving(true);
    setError(null);
    try {
      await setTaskStar(taskGtId, star);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function clear() {
    setSaving(true);
    setError(null);
    try {
      await removeTaskStar(taskGtId);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-1">
        {STAR_TYPES.map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => choose(star)}
            disabled={saving}
            aria-label={STAR_LABELS[star]}
            aria-pressed={star === currentStar}
            className={cn(
              "flex size-7 items-center justify-center rounded-md hover:bg-muted disabled:opacity-50",
              star === currentStar && "bg-muted",
            )}
          >
            <Star className={cn("size-4", star === currentStar ? STAR_COLOUR_CLASSES[star] : "text-muted-foreground")} />
          </button>
        ))}
        {currentStar && (
          <button
            type="button"
            onClick={clear}
            disabled={saving}
            aria-label="Remove star"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
