import type { FastifyInstance } from "fastify";
import { runSync } from "../sync/sync.js";

// Runs exactly the routine used on startup - no separate manual-sync implementation
// (plan.md section 27). A sync already in progress is joined rather than duplicated
// (plan.md section 28).
export async function syncRoutes(app: FastifyInstance) {
  app.post("/api/sync", async () => runSync());
}
