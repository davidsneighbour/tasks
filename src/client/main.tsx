import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { applyTheme } from "@client/lib/theme";
import { App } from "./App";
import "./index.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found.");
}

// Applied before the first render so the correct theme class is in place before React paints.
applyTheme();

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
