import { CalendarClock, CheckCircle2, Circle, ListTodo, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router";
import { LabelBadge } from "@client/features/labels/LabelBadge";
import { getLabels, getTaskLists } from "@client/lib/api";
import { onLabelsChanged } from "@client/lib/label-events";
import { useFetch } from "@client/lib/use-fetch";
import { cn } from "@client/lib/utils";

const BUILT_IN_VIEWS = [
  { to: "/next", label: "Next", icon: Circle },
  { to: "/overdue", label: "Overdue", icon: CalendarClock },
  { to: "/all", label: "All", icon: ListTodo },
  { to: "/completed", label: "Completed", icon: CheckCircle2 },
];

function navLinkClassName(isActive: boolean): string {
  return cn(
    "flex items-center gap-2 truncate rounded-md px-2 py-1.5 text-sm",
    isActive ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted",
  );
}

export function AppShell() {
  const taskListsState = useFetch(() => getTaskLists(), []);
  const [labelsRefreshKey, setLabelsRefreshKey] = useState(0);
  const labelsState = useFetch(() => getLabels(), [labelsRefreshKey]);

  useEffect(() => onLabelsChanged(() => setLabelsRefreshKey((key) => key + 1)), []);

  return (
    <div className="grid h-dvh grid-cols-[240px_1fr] bg-background text-foreground">
      <aside className="flex flex-col gap-6 overflow-y-auto border-r border-border p-4">
        <div className="text-sm font-semibold tracking-tight">Tasks</div>

        <nav className="flex flex-col gap-1">
          {BUILT_IN_VIEWS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => navLinkClassName(isActive)}>
              <Icon className="size-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div>
          <div className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Lists</div>
          <nav className="mt-1 flex flex-col gap-1">
            {taskListsState.status === "loading" && <p className="px-2 text-sm text-muted-foreground">Loading…</p>}
            {taskListsState.status === "error" && (
              <p className="px-2 text-sm text-red-600 dark:text-red-400">{taskListsState.message}</p>
            )}
            {taskListsState.status === "ready" &&
              taskListsState.data.taskLists.map((list) => (
                <NavLink key={list.gtId} to={`/lists/${list.gtId}`} className={({ isActive }) => navLinkClassName(isActive)}>
                  {list.title}
                </NavLink>
              ))}
            {taskListsState.status === "ready" && taskListsState.data.taskLists.length === 0 && (
              <p className="px-2 text-sm text-muted-foreground">No lists yet. Run a sync.</p>
            )}
          </nav>
        </div>

        <div>
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Labels</span>
            <NavLink to="/labels" className="text-muted-foreground hover:text-foreground" aria-label="Manage labels">
              <Settings className="size-3.5" />
            </NavLink>
          </div>
          <nav className="mt-1 flex flex-col gap-1">
            {labelsState.status === "loading" && <p className="px-2 text-sm text-muted-foreground">Loading…</p>}
            {labelsState.status === "error" && (
              <p className="px-2 text-sm text-red-600 dark:text-red-400">{labelsState.message}</p>
            )}
            {labelsState.status === "ready" &&
              labelsState.data.labels.map((labelItem) => (
                <NavLink
                  key={labelItem.id}
                  to={`/labels/${labelItem.id}`}
                  className={({ isActive }) => navLinkClassName(isActive)}
                >
                  <LabelBadge label={labelItem} />
                </NavLink>
              ))}
            {labelsState.status === "ready" && labelsState.data.labels.length === 0 && (
              <NavLink to="/labels" className="px-2 text-sm text-muted-foreground hover:text-foreground">
                No labels yet. Create one.
              </NavLink>
            )}
          </nav>
        </div>
      </aside>

      <main className="overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
