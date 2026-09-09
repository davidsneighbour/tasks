import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getViewSettings, resetViewSettings, setViewSettings } from "./view-settings.js";

// No jsdom in this project's test setup; a minimal in-memory Storage stand-in is enough to
// exercise the read/write/reset logic without pulling in a DOM environment.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe("view-settings", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", new MemoryStorage());
    vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const DEFAULTS = { deadTasksThresholdDays: 28, theme: "system" };

  it("returns defaults when nothing is stored", () => {
    expect(getViewSettings()).toEqual(DEFAULTS);
  });

  it("returns defaults when stored data is invalid JSON", () => {
    localStorage.setItem("tasks:view-settings", "{not json");
    expect(getViewSettings()).toEqual(DEFAULTS);
  });

  it("returns defaults when stored data fails schema validation", () => {
    localStorage.setItem("tasks:view-settings", JSON.stringify({ deadTasksThresholdDays: -1 }));
    expect(getViewSettings()).toEqual(DEFAULTS);
  });

  it("persists a partial update merged onto existing settings", () => {
    setViewSettings({ deadTasksThresholdDays: 14 });
    expect(getViewSettings()).toEqual({ ...DEFAULTS, deadTasksThresholdDays: 14 });
  });

  it("persists the theme independently of other settings", () => {
    setViewSettings({ deadTasksThresholdDays: 14 });
    setViewSettings({ theme: "dark" });
    expect(getViewSettings()).toEqual({ deadTasksThresholdDays: 14, theme: "dark" });
  });

  it("resets to defaults", () => {
    setViewSettings({ deadTasksThresholdDays: 14, theme: "dark" });
    resetViewSettings();
    expect(getViewSettings()).toEqual(DEFAULTS);
  });
});
