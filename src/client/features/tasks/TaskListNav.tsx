import type { DragEvent } from "react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import type { TaskListDTO } from "@shared/types";
import { getTaskLists, setTaskListOrder } from "@client/lib/api";
import { onSyncCompleted } from "@client/lib/sync-events";
import { onTasksChanged } from "@client/lib/task-events";
import { useFetch } from "@client/lib/use-fetch";

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
  const [draggedGtId, setDraggedGtId] = useState<string | null>(null);

  useEffect(() => onSyncCompleted(() => setRefreshKey((key) => key + 1)), []);
  useEffect(() => onTasksChanged(() => setRefreshKey((key) => key + 1)), []);

  useEffect(() => {
    if (state.status === "ready") setOrderedLists(state.data.taskLists);
  }, [state]);

  function handleDragOver(event: DragEvent<HTMLAnchorElement>, overGtId: string) {
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

  function handleDrop(event: DragEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (!draggedGtId) return;
    setDraggedGtId(null);
    void setTaskListOrder(orderedLists.map((list) => list.gtId));
  }

  if (state.status === "loading") return <p className="px-2 text-sm text-muted-foreground">Loading…</p>;
  if (state.status === "error") return <p className="px-2 text-sm text-red-600 dark:text-red-400">{state.message}</p>;
  if (orderedLists.length === 0) return <p className="px-2 text-sm text-muted-foreground">No lists yet. Run a sync.</p>;

  return (
    <>
      {orderedLists.map((list) => (
        <NavLink
          key={list.gtId}
          to={`/lists/${list.gtId}`}
          onClick={onNavigate}
          className={({ isActive }) => navLinkClassName(isActive)}
          draggable
          onDragStart={() => setDraggedGtId(list.gtId)}
          onDragOver={(event) => handleDragOver(event, list.gtId)}
          onDrop={handleDrop}
          onDragEnd={() => setDraggedGtId(null)}
        >
          <span className="truncate">{list.title}</span>
          <span className="ml-auto text-xs text-muted-foreground">{listCounts[list.gtId] ?? ""}</span>
        </NavLink>
      ))}
    </>
  );
}
