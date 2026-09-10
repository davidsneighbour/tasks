import { CalendarClock, CheckCircle2, Circle, Ghost, ListTodo, Menu, Monitor, Moon, RotateCcw, Settings, Star, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router";
import { LabelBadge } from "@client/features/labels/LabelBadge";
import { SyncStatus } from "@client/features/sync/SyncStatus";
import { getLabels, getTaskCounts, getTaskLists } from "@client/lib/api";
import { onLabelsChanged } from "@client/lib/label-events";
import { onSyncCompleted } from "@client/lib/sync-events";
import { onTasksChanged } from "@client/lib/task-events";
import { applyTheme } from "@client/lib/theme";
import { useFetch } from "@client/lib/use-fetch";
import { cn } from "@client/lib/utils";
import { type ViewSettings, getViewSettings, resetViewSettings, setViewSettings } from "@client/lib/view-settings";
import { onViewSettingsChanged } from "@client/lib/view-settings-events";

const BUILT_IN_VIEWS = [
  { to: "/next", label: "Next", icon: Circle },
  { to: "/overdue", label: "Overdue", icon: CalendarClock },
  { to: "/starred", label: "Starred", icon: Star },
  { to: "/all", label: "All", icon: ListTodo },
  { to: "/completed", label: "Completed", icon: CheckCircle2 },
  { to: "/dead", label: "Dead tasks", icon: Ghost },
];

const THEME_ICONS = { system: Monitor, light: Sun, dark: Moon } as const;
const NEXT_THEME: Record<ViewSettings["theme"], ViewSettings["theme"]> = { system: "light", light: "dark", dark: "system" };

function navLinkClassName(isActive: boolean): string {
  return cn(
    "flex items-center gap-2 truncate rounded-md px-2 py-1.5 text-sm",
    isActive ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted",
  );
}

export function AppShell() {
  const [refreshKey, setRefreshKey] = useState(0);
  const taskListsState = useFetch(() => getTaskLists(), [refreshKey]);
  const labelsState = useFetch(() => getLabels(), [refreshKey]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState(() => getViewSettings().theme);
  const [deadTasksThresholdDays, setDeadTasksThresholdDays] = useState(() => getViewSettings().deadTasksThresholdDays);
  const countsState = useFetch(() => getTaskCounts({ deadTasksThresholdDays }), [refreshKey, deadTasksThresholdDays]);

  useEffect(() => onLabelsChanged(() => setRefreshKey((key) => key + 1)), []);
  useEffect(() => onSyncCompleted(() => setRefreshKey((key) => key + 1)), []);
  useEffect(() => onTasksChanged(() => setRefreshKey((key) => key + 1)), []);

  useEffect(() => {
    const unsubscribe = onViewSettingsChanged(() => {
      const settings = getViewSettings();
      setTheme(settings.theme);
      setDeadTasksThresholdDays(settings.deadTasksThresholdDays);
      applyTheme();
    });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", applyTheme);
    return () => {
      unsubscribe();
      media.removeEventListener("change", applyTheme);
    };
  }, []);

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  function cycleTheme() {
    setTheme(setViewSettings({ theme: NEXT_THEME[theme] }).theme);
    applyTheme();
  }

  const ThemeIcon = THEME_ICONS[theme];
  const viewCounts = countsState.status === "ready" ? countsState.data.views : {};
  const listCounts = countsState.status === "ready" ? countsState.data.lists : {};

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground md:grid md:grid-cols-[240px_1fr]">
      <header className="flex items-center justify-between border-b border-border p-4 md:hidden">
        <span className="text-sm font-semibold tracking-tight">Tasks</span>
        <button type="button" onClick={() => setMobileNavOpen(true)} aria-label="Open menu" className="text-muted-foreground">
          <Menu className="size-5" />
        </button>
      </header>

      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={closeMobileNav}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-6 overflow-y-auto border-r border-border bg-background p-4 transition-transform duration-200 md:static md:z-auto md:w-auto md:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="hidden text-sm font-semibold tracking-tight md:block">Tasks</div>

        <nav className="flex flex-col gap-1">
          {BUILT_IN_VIEWS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={closeMobileNav} className={({ isActive }) => navLinkClassName(isActive)}>
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
              <span className="ml-auto text-xs text-muted-foreground">{viewCounts[to.slice(1)] ?? ""}</span>
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
                <NavLink
                  key={list.gtId}
                  to={`/lists/${list.gtId}`}
                  onClick={closeMobileNav}
                  className={({ isActive }) => navLinkClassName(isActive)}
                >
                  <span className="truncate">{list.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{listCounts[list.gtId] ?? ""}</span>
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
            <NavLink to="/labels" onClick={closeMobileNav} className="text-muted-foreground hover:text-foreground" aria-label="Manage labels">
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
                  onClick={closeMobileNav}
                  className={({ isActive }) => navLinkClassName(isActive)}
                >
                  <LabelBadge label={labelItem} />
                </NavLink>
              ))}
            {labelsState.status === "ready" && labelsState.data.labels.length === 0 && (
              <NavLink to="/labels" onClick={closeMobileNav} className="px-2 text-sm text-muted-foreground hover:text-foreground">
                No labels yet. Create one.
              </NavLink>
            )}
          </nav>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <SyncStatus />
          <button
            type="button"
            onClick={cycleTheme}
            className="flex items-center gap-1.5 self-start px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ThemeIcon className="size-3.5" />
            Theme: {theme}
          </button>
          <button
            type="button"
            onClick={() => resetViewSettings()}
            className="flex items-center gap-1.5 self-start px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            Reset view settings
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
