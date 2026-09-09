// AppShell's sidebar and the label manager page both read labels independently (no shared
// state/store in this app). This lets the manager tell the sidebar to refetch after a
// create/update/delete, without introducing a state library for one cross-component signal.
const LABELS_CHANGED_EVENT = "tasks:labels-changed";

export function notifyLabelsChanged(): void {
  window.dispatchEvent(new Event(LABELS_CHANGED_EVENT));
}

export function onLabelsChanged(handler: () => void): () => void {
  window.addEventListener(LABELS_CHANGED_EVENT, handler);
  return () => window.removeEventListener(LABELS_CHANGED_EVENT, handler);
}
