import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { completeTask, deleteTask, getTasks, reopenTask } from "@client/lib/api";
import { useFetch } from "@client/lib/use-fetch";
import { QuickCreate } from "./QuickCreate";
import { TaskDetail } from "./TaskDetail";
import { TaskRow } from "./TaskRow";

export interface TasksPageProps {
  view?: string;
  title: string;
}

const SELECTED_TASK_PARAM = "task";

export function TasksPage({ view, title }: TasksPageProps) {
  const { gtId: list, labelId } = useParams<{ gtId?: string; labelId?: string }>();
  const label = labelId ? Number(labelId) : undefined;
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGtId = searchParams.get(SELECTED_TASK_PARAM);
  const [refreshKey, setRefreshKey] = useState(0);
  const [togglingGtId, setTogglingGtId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const state = useFetch(() => {
    if (list) return getTasks({ list });
    if (label !== undefined) return getTasks({ label });
    if (view) return getTasks({ view });
    return getTasks({});
  }, [view, list, label, refreshKey]);

  const selectedTask = useMemo(() => {
    if (state.status !== "ready" || !selectedGtId) return null;
    return state.data.tasks.find((task) => task.gtId === selectedGtId) ?? null;
  }, [state, selectedGtId]);

  function selectTask(gtId: string) {
    const next = new URLSearchParams(searchParams);
    next.set(SELECTED_TASK_PARAM, gtId);
    setSearchParams(next);
  }

  function closeDetail() {
    const next = new URLSearchParams(searchParams);
    next.delete(SELECTED_TASK_PARAM);
    setSearchParams(next);
  }

  function refresh() {
    setRefreshKey((key) => key + 1);
  }

  async function toggleComplete(gtId: string, isCompleted: boolean) {
    setTogglingGtId(gtId);
    setActionError(null);
    try {
      await (isCompleted ? reopenTask(gtId) : completeTask(gtId));
      refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setTogglingGtId(null);
    }
  }

  async function handleDelete() {
    if (!selectedGtId) return;
    setDeleting(true);
    setActionError(null);
    try {
      await deleteTask(selectedGtId);
      closeDetail();
      refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setDeleting(false);
    }
  }

  const pageTitle = list || label !== undefined ? "Tasks" : title;

  return (
    <div className="flex h-full gap-6">
      <div className="min-w-0 flex-1">
        <h1 className="mb-4 text-lg font-semibold">{pageTitle}</h1>

        {list && <QuickCreate taskListGtId={list} onCreated={refresh} />}
        {actionError && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{actionError}</p>}

        {state.status === "loading" && <p className="text-sm text-muted-foreground">Loading…</p>}
        {state.status === "error" && <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>}
        {state.status === "ready" && state.data.tasks.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing here.</p>
        )}
        {state.status === "ready" && (
          <div className="flex flex-col gap-1">
            {state.data.tasks.map((task) => (
              <TaskRow
                key={task.gtId}
                task={task}
                selected={task.gtId === selectedGtId}
                onSelect={() => selectTask(task.gtId)}
                onToggleComplete={() => toggleComplete(task.gtId, task.status === "completed")}
                toggling={togglingGtId === task.gtId}
              />
            ))}
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={closeDetail}
          onDelete={handleDelete}
          onChanged={refresh}
          deleting={deleting}
        />
      )}
    </div>
  );
}
