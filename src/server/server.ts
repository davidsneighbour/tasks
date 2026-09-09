import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { statusRoutes } from "./api/status.js";
import { syncRoutes } from "./api/sync.js";
import { taskListsRoutes } from "./api/task-lists.js";
import { tasksRoutes } from "./api/tasks.js";
import { config, hasGoogleCredentials } from "./config/env.js";
import { runSync } from "./sync/sync.js";

const app = Fastify({ logger: true });

await app.register(taskListsRoutes);
await app.register(tasksRoutes);
await app.register(statusRoutes);
await app.register(syncRoutes);

// Container health: must not depend on Google connectivity (plan.md section 59).
app.get("/health", async () => ({ status: "ok" }));

if (process.env.NODE_ENV === "production") {
  await app.register(fastifyStatic, {
    root: fileURLToPath(new URL("../client", import.meta.url)),
  });

  app.setNotFoundHandler((request, reply) => {
    if (request.raw.url?.startsWith("/api")) {
      reply.code(404).send({ error: "Not found" });
      return;
    }
    reply.sendFile("index.html");
  });
}

try {
  await app.listen({ port: config.server.port, host: config.server.host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

// Serve immediately and expose progress through /api/status rather than blocking startup on
// reconciliation (plan.md section 16's "better diagnostics" option).
if (hasGoogleCredentials()) {
  runSync()
    .then((result) => {
      if (result.status === "success") {
        app.log.info(
          `sync complete: ${result.listsAdded} lists added, ${result.listsUpdated} updated, ` +
            `${result.listsRemoved} removed; ${result.tasksAdded} tasks added, ` +
            `${result.tasksUpdated} updated, ${result.tasksRemoved} removed`,
        );
      } else {
        app.log.error(`startup sync failed: ${result.message}`);
      }
    })
    .catch((error: unknown) => {
      app.log.error(error);
    });
} else {
  app.log.warn("Google credentials are not configured; skipping startup sync. Run `npm run auth:setup`.");
}
