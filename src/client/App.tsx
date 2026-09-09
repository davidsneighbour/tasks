import { Navigate, Route, Routes } from "react-router";
import { LabelManager } from "@client/features/labels/LabelManager";
import { TasksPage } from "@client/features/tasks/TasksPage";
import { AppShell } from "@client/layouts/AppShell";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/next" replace />} />
        <Route path="next" element={<TasksPage view="next" title="Next" />} />
        <Route path="overdue" element={<TasksPage view="overdue" title="Overdue" />} />
        <Route path="starred" element={<TasksPage view="starred" title="Starred" />} />
        <Route path="all" element={<TasksPage view="all" title="All" />} />
        <Route path="completed" element={<TasksPage view="completed" title="Completed" />} />
        <Route path="dead" element={<TasksPage view="dead" title="Dead tasks" />} />
        <Route path="lists/:gtId" element={<TasksPage title="Tasks" />} />
        <Route path="labels" element={<LabelManager />} />
        <Route path="labels/:labelId" element={<TasksPage title="Tasks" />} />
      </Route>
    </Routes>
  );
}
