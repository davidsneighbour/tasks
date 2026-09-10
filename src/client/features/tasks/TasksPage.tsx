import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { completeTask, deleteTask, getTasks, reopenTask } from "@client/lib/api";
import { onSyncCompleted } from "@client/lib/sync-events";
import { notifyTasksChanged } from "@client/lib/task-events";
import { useFetch } from "@client/lib/use-fetch";
import { getViewSettings, setViewSettings } from "@client/lib/view-settings";
import { onViewSettingsChanged } from "@client/lib/view-settings-events";
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
  const isDeadView = view === "dead";
  const [deadTasksThresholdDays, setDeadTasksThresholdDays] = useState(() => getViewSettings().deadTasksThresholdDays);

  useEffect(() => {
    if (!isDeadView) return;
    return onViewSettingsChanged(() => setDeadTasksThresholdDays(getViewSettings().deadTasksThresholdDays));
  }, [isDeadView]);

  function updateDeadTasksThreshold(days: number) {
    setDeadTasksThresholdDays(setViewSettings({ deadTasksThresholdDays: days }).deadTasksThresholdDays);
  }

  const state = useFetch(() => {
    if (list) return getTasks({ list });
    if (label !== undefined) return getTasks({ label });
    if (isDeadView) return getTasks({ view, thresholdDays: deadTasksThresholdDays });
    if (view) return getTasks({ view });
    return getTasks({});
  }, [view, list, label, refreshKey, isDeadView, deadTasksThresholdDays]);

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
    notifyTasksChanged();
  }

  useEffect(() => onSyncCompleted(refresh), []);

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
    <div className="flex h-full flex-col gap-6 md:flex-row">
      <div className="min-w-0 flex-1">
        <h1 className="mb-4 text-lg font-semibold">{pageTitle}</h1>

        {isDeadView && (
          <label className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            Overdue by more than
            <input
              type="number"
              min={1}
              value={deadTasksThresholdDays}
              onChange={(event) => {
                const days = Number(event.target.value);
                if (Number.isInteger(days) && days > 0) updateDeadTasksThreshold(days);
              }}
              className="w-16 rounded-md border border-border bg-background px-2 py-1 text-foreground"
            />
            days
          </label>
        )}

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
