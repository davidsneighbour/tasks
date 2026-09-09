import type { LabelDTO } from "@shared/types";
import { LABEL_COLOUR_CLASSES } from "@client/lib/label-colors";
import { LABEL_ICON_COMPONENTS } from "@client/lib/label-icons";
import { cn } from "@client/lib/utils";

export interface LabelBadgeProps {
  label: LabelDTO;
  className?: string;
}

export function LabelBadge({ label, className }: LabelBadgeProps) {
  const Icon = LABEL_ICON_COMPONENTS[label.icon];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        LABEL_COLOUR_CLASSES[label.colour],
        className,
      )}
    >
      <Icon className="size-3" />
      {label.name}
    </span>
  );
}
