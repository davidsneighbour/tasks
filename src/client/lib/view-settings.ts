import { z } from "zod";
import { notifyViewSettingsChanged } from "./view-settings-events.js";

// Single schema-validated store for client-only view preferences (dark mode, the dead-tasks
// overdue threshold, etc.), so each feature doesn't invent its own local-storage key and shape.
const ViewSettingsSchema = z.object({
  deadTasksThresholdDays: z.number().int().positive().default(28),
  theme: z.enum(["system", "light", "dark"]).default("system"),
});

export type ViewSettings = z.infer<typeof ViewSettingsSchema>;

const STORAGE_KEY = "tasks:view-settings";

const DEFAULT_SETTINGS: ViewSettings = ViewSettingsSchema.parse({});

export function getViewSettings(): ViewSettings {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return DEFAULT_SETTINGS;
  }
  if (!raw) return DEFAULT_SETTINGS;

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }

  const result = ViewSettingsSchema.safeParse(parsedJson);
  return result.success ? result.data : DEFAULT_SETTINGS;
}

export function setViewSettings(update: Partial<ViewSettings>): ViewSettings {
  const next = ViewSettingsSchema.parse({ ...getViewSettings(), ...update });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable (private browsing quota, disabled storage); the in-memory
    // default still applies for the current session.
  }
  notifyViewSettingsChanged();
  return next;
}

export function resetViewSettings(): ViewSettings {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage isn't available.
  }
  notifyViewSettingsChanged();
  return DEFAULT_SETTINGS;
}
