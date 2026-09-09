import type { FastifyInstance } from "fastify";
import { hasGoogleCredentials } from "../config/env.js";
import { getSyncState, isSyncing } from "../sync/sync.js";

// Application readiness (auth + sync), distinct from container health (plan.md sections 16, 59).
// States: starting, authenticating, syncing, ready, error.
export async function statusRoutes(app: FastifyInstance) {
  app.get("/api/status", async () => {
    const sync = await getSyncState();

    if (!hasGoogleCredentials()) {
      return { status: "authenticating", authenticated: false, sync };
    }
    if (isSyncing()) {
      return { status: "syncing", authenticated: true, sync };
    }
    if (sync.status === "error") {
      return { status: "error", authenticated: true, sync };
    }
    if (sync.status === "success") {
      return { status: "ready", authenticated: true, sync };
    }
    return { status: "starting", authenticated: true, sync };
  });
}
