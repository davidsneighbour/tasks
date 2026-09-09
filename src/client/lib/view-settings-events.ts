// Same small event-bus pattern as label-events.ts and sync-events.ts: lets any component that
// changes view settings (or resets them) tell other mounted components to re-read them.
const VIEW_SETTINGS_CHANGED_EVENT = "tasks:view-settings-changed";

export function notifyViewSettingsChanged(): void {
  window.dispatchEvent(new Event(VIEW_SETTINGS_CHANGED_EVENT));
}

export function onViewSettingsChanged(handler: () => void): () => void {
  window.addEventListener(VIEW_SETTINGS_CHANGED_EVENT, handler);
  return () => window.removeEventListener(VIEW_SETTINGS_CHANGED_EVENT, handler);
}
