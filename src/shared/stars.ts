// Initial star set (plan.md section 10): a richer Gmail-like star, not several booleans.
// A task has no star or exactly one star - never more than one at a time.
export const STAR_TYPES = ["yellow-star", "red-star", "blue-star", "green-star", "purple-star"] as const;
export type StarType = (typeof STAR_TYPES)[number];
