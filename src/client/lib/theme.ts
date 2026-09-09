import { getViewSettings } from "./view-settings.js";

export type ResolvedTheme = "light" | "dark";

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// "system" defers to the OS preference at the moment it's resolved, rather than storing a
// snapshot of it, so a later OS-level change takes effect the next time applyTheme() runs.
export function resolveTheme(theme = getViewSettings().theme): ResolvedTheme {
  return theme === "system" ? (prefersDark() ? "dark" : "light") : theme;
}

export function applyTheme(): void {
  document.documentElement.classList.toggle("dark", resolveTheme() === "dark");
}
