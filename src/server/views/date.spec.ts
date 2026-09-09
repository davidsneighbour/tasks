import { describe, expect, it } from "vitest";
import { addDays, dueDateString, toDateString } from "./date.js";

describe("toDateString", () => {
  it("formats using the local calendar date, zero-padded", () => {
    expect(toDateString(new Date(2024, 0, 5))).toBe("2024-01-05");
  });
});

describe("addDays", () => {
  it("adds days, rolling over month boundaries", () => {
    expect(addDays("2024-01-30", 3)).toBe("2024-02-02");
  });

  it("supports negative offsets", () => {
    expect(addDays("2024-01-01", -1)).toBe("2023-12-31");
  });
});

describe("dueDateString", () => {
  it("takes the date portion of a GT due timestamp", () => {
    expect(dueDateString("2024-01-15T00:00:00.000Z")).toBe("2024-01-15");
  });

  it("returns null when there is no due date", () => {
    expect(dueDateString(null)).toBeNull();
  });
});
