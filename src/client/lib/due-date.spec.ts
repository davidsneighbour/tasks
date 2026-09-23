import { describe, expect, it } from "vitest";
import { formatDueDate } from "./due-date.js";

describe("formatDueDate", () => {
  const now = new Date("2024-06-15T12:00:00.000Z");

  it("reports no due date", () => {
    expect(formatDueDate(null, now)).toBe("No due date");
  });

  it("reports today, tomorrow, and yesterday", () => {
    expect(formatDueDate("2024-06-15T00:00:00.000Z", now)).toBe("Today");
    expect(formatDueDate("2024-06-16T00:00:00.000Z", now)).toBe("Tomorrow");
    expect(formatDueDate("2024-06-14T00:00:00.000Z", now)).toBe("Yesterday");
  });

  it("reports relative days within the 5-day window", () => {
    expect(formatDueDate("2024-06-20T00:00:00.000Z", now)).toBe("In 5 days");
    expect(formatDueDate("2024-06-10T00:00:00.000Z", now)).toBe("5 days ago");
  });

  it("falls back to the plain date beyond 5 days", () => {
    const sixDaysOut = new Date("2024-06-21T00:00:00").toLocaleDateString();
    const sixDaysAgo = new Date("2024-06-09T00:00:00").toLocaleDateString();
    expect(formatDueDate("2024-06-21T00:00:00.000Z", now)).toBe(sixDaysOut);
    expect(formatDueDate("2024-06-09T00:00:00.000Z", now)).toBe(sixDaysAgo);
  });
});
