// GT due dates are dates, not times (plan.md section 13): compare only the date portion,
// using the local calendar date so "today" matches what the user actually sees.

export function todayDateString(): string {
  return toDateString(new Date());
}

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

export function dueDateString(due: string | null): string | null {
  return due ? due.slice(0, 10) : null;
}
