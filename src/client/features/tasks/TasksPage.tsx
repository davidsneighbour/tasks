import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router";
import { getTasks } from "@client/lib/api";
import { useFetch } from "@client/lib/use-fetch";
import { TaskDetail } from "./TaskDetail";
import { TaskRow } from "./TaskRow";

export interface TasksPageProps {
  view?: string;
  title: string;
}

const SELECTED_TASK_PARAM = "task";

export function TasksPage({ view, title }: TasksPageProps) {
  const { gtId: list } = useParams<{ gtId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGtId = searchParams.get(SELECTED_TASK_PARAM);

  const state = useFetch(() => getTasks(list ? { list } : view ? { view } : {}), [view, list]);

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

  return (
    <div className="flex h-full gap-6">
      <div className="min-w-0 flex-1">
        <h1 className="mb-4 text-lg font-semibold">{list ? "Tasks" : title}</h1>

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
              />
            ))}
          </div>
        )}
      </div>

      {selectedTask && <TaskDetail task={selectedTask} onClose={closeDetail} />}
    </div>
  );
}
