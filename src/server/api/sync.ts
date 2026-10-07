import type { FastifyInstance } from "fastify";
import { runSync } from "../sync/sync.js";

// Runs exactly the routine used on startup - no separate manual-sync implementation
//. A sync already in progress is joined rather than duplicated.
export async function syncRoutes(app: FastifyInstance) {
  app.post("/api/sync", async () => runSync());
}
