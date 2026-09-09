import type { StarType } from "@shared/stars";

// Icon fill/text colour per star type (plan.md section 10).
export const STAR_COLOUR_CLASSES: Record<StarType, string> = {
  "yellow-star": "text-yellow-500 fill-yellow-500",
  "red-star": "text-red-500 fill-red-500",
  "blue-star": "text-blue-500 fill-blue-500",
  "green-star": "text-green-500 fill-green-500",
  "purple-star": "text-purple-500 fill-purple-500",
};

export const STAR_LABELS: Record<StarType, string> = {
  "yellow-star": "Yellow star",
  "red-star": "Red star",
  "blue-star": "Blue star",
  "green-star": "Green star",
  "purple-star": "Purple star",
};
