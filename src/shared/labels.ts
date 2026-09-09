// Constrained semantic palette (plan.md section 9), shared so the server can validate
// and the client can render swatches/pickers from the same list.
export const LABEL_COLOURS = ["red", "orange", "amber", "green", "teal", "blue", "indigo", "purple", "pink", "gray"] as const;
export type LabelColour = (typeof LABEL_COLOURS)[number];

// A curated subset of Lucide icon names a label can use. Stored as plain text
// (plan.md section 9: "Lucide icon names rather than SVG blobs"); the client maps these to
// actual icon components.
export const LABEL_ICON_NAMES = [
  "tag",
  "star",
  "flag",
  "bookmark",
  "bell",
  "heart",
  "briefcase",
  "house",
  "search",
  "triangle-alert",
] as const;
export type LabelIconName = (typeof LABEL_ICON_NAMES)[number];
