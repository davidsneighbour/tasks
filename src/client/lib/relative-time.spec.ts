import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./relative-time.js";

describe("formatRelativeTime", () => {
  const now = new Date("2024-01-01T00:10:00.000Z");

  it("reports very recent times as just now", () => {
    expect(formatRelativeTime("2024-01-01T00:09:58.000Z", now)).toBe("just now");
  });

  it("reports seconds", () => {
    expect(formatRelativeTime("2024-01-01T00:09:40.000Z", now)).toBe("20 seconds ago");
  });

  it("reports minutes", () => {
    expect(formatRelativeTime("2024-01-01T00:05:00.000Z", now)).toBe("5 minutes ago");
  });

  it("uses singular minute", () => {
    expect(formatRelativeTime("2024-01-01T00:09:00.000Z", now)).toBe("1 minute ago");
  });

  it("reports hours and days for older times", () => {
    expect(formatRelativeTime("2023-12-31T22:10:00.000Z", now)).toBe("2 hours ago");
    expect(formatRelativeTime("2023-12-30T00:10:00.000Z", now)).toBe("2 days ago");
  });
});
