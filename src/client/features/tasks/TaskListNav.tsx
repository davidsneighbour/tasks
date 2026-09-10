import { Pin } from "lucide-react";
import type { DragEvent } from "react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import type { TaskListDTO } from "@shared/types";
import { getTaskLists, setDefaultTaskList, setTaskListOrder } from "@client/lib/api";
import { onSyncCompleted } from "@client/lib/sync-events";
import { onTasksChanged } from "@client/lib/task-events";
import { useFetch } from "@client/lib/use-fetch";
import { cn } from "@client/lib/utils";

export interface TaskListNavProps {
  listCounts: Record<string, number>;
  navLinkClassName: (isActive: boolean) => string;
  onNavigate: () => void;
}

// Native HTML5 drag and drop (no extra dependency needed): dragging a list over another
// live-reorders the displayed order, and dropping persists the final order to the database
// (issue #18), not local storage, so it follows the user across devices/browsers.
export function TaskListNav({ listCounts, navLinkClassName, onNavigate }: TaskListNavProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const state = useFetch(() => getTaskLists(), [refreshKey]);
  const [orderedLists, setOrderedLists] = useState<TaskListDTO[]>([]);
  const [defaultGtId, setDefaultGtId] = useState<string | null>(null);
  const [draggedGtId, setDraggedGtId] = useState<string | null>(null);

  useEffect(() => onSyncCompleted(() => setRefreshKey((key) => key + 1)), []);
  useEffect(() => onTasksChanged(() => setRefreshKey((key) => key + 1)), []);

  useEffect(() => {
    if (state.status === "ready") {
      setOrderedLists(state.data.taskLists);
      setDefaultGtId(state.data.defaultTaskListGtId);
    }
  }, [state]);

  function handleDragOver(event: DragEvent<HTMLDivElement>, overGtId: string) {
    event.preventDefault();
    if (!draggedGtId || draggedGtId === overGtId) return;

    setOrderedLists((current) => {
      const fromIndex = current.findIndex((list) => list.gtId === draggedGtId);
      const toIndex = current.findIndex((list) => list.gtId === overGtId);
      if (fromIndex === -1 || toIndex === -1) return current;

      const next = [...current];
      const dragged = next.splice(fromIndex, 1)[0];
      if (!dragged) return current;
      next.splice(toIndex, 0, dragged);
      return next;
    });
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!draggedGtId) return;
    setDraggedGtId(null);
    void setTaskListOrder(orderedLists.map((list) => list.gtId));
  }

  // Toggling the current default off falls back to whatever's first in sidebar order
  // (issue #20), rather than leaving no list at all as the effective default.
  function toggleDefault(gtId: string) {
    const next = defaultGtId === gtId ? null : gtId;
    setDefaultGtId(next);
    void setDefaultTaskList(next);
  }

  if (state.status === "loading") return <p className="px-2 text-sm text-muted-foreground">Loading…</p>;
  if (state.status === "error") return <p className="px-2 text-sm text-red-600 dark:text-red-400">{state.message}</p>;
  if (orderedLists.length === 0) return <p className="px-2 text-sm text-muted-foreground">No lists yet. Run a sync.</p>;

  return (
    <>
      {orderedLists.map((list) => {
        const isDefault = list.gtId === defaultGtId;
        return (
          <div
            key={list.gtId}
            className="flex items-center gap-0.5"
            draggable
            onDragStart={() => setDraggedGtId(list.gtId)}
            onDragOver={(event) => handleDragOver(event, list.gtId)}
            onDrop={handleDrop}
            onDragEnd={() => setDraggedGtId(null)}
          >
            <NavLink to={`/lists/${list.gtId}`} onClick={onNavigate} className={({ isActive }) => cn(navLinkClassName(isActive), "flex-1")}>
              <span className="truncate">{list.title}</span>
              <span className="ml-auto text-xs text-muted-foreground">{listCounts[list.gtId] ?? ""}</span>
            </NavLink>
            <button
              type="button"
              onClick={() => toggleDefault(list.gtId)}
              aria-label={isDefault ? `Unset ${list.title} as the default list` : `Set ${list.title} as the default list`}
              title={isDefault ? "Default list" : "Set as default list"}
              className={cn("shrink-0 rounded-md p-1.5", isDefault ? "text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              <Pin className={cn("size-3.5", isDefault && "fill-current")} />
            </button>
          </div>
        );
      })}
    </>
  );
}
