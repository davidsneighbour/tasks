// GT due dates are dates, not times: compare only the date portion,
// using the local calendar date so "today" matches what the user actually sees.

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dueDateString(due: string | null): string | null {
  return due ? due.slice(0, 10) : null;
}

function daysBetween(fromDateString: string, toDateString: string): number {
  const from = new Date(`${fromDateString}T00:00:00`);
  const to = new Date(`${toDateString}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

const RELATIVE_DAY_LABELS: Record<number, string> = {
  [-1]: "Yesterday",
  0: "Today",
  1: "Tomorrow",
};

// Within 5 days either side of today, use a relative label; further out, show the date itself.
export function formatDueDate(due: string | null, now: Date = new Date()): string {
  const dateString = dueDateString(due);
  if (!dateString) return "No due date";

  const diff = daysBetween(toDateString(now), dateString);
  if (Math.abs(diff) > 5) {
    return new Date(`${dateString}T00:00:00`).toLocaleDateString();
  }

  const relativeLabel = RELATIVE_DAY_LABELS[diff];
  if (relativeLabel) return relativeLabel;
  return diff > 0 ? `In ${diff} days` : `${Math.abs(diff)} days ago`;
}
