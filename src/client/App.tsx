import { Route, Routes } from "react-router";

function Shell() {
  return (
    <main className="flex h-dvh items-center justify-center bg-background text-foreground">
      <p className="text-sm text-muted-foreground">Tasks - application shell.</p>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/*" element={<Shell />} />
    </Routes>
  );
}
