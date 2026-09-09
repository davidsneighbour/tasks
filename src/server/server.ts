import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { config, hasGoogleCredentials } from "./config/env.js";

const app = Fastify({ logger: true });

// Container health: must not depend on Google connectivity (plan.md section 59).
app.get("/health", async () => ({ status: "ok" }));

// GT/application readiness lives here, separate from container health (plan.md section 16).
app.get("/api/status", async () => ({
  status: hasGoogleCredentials() ? "ready" : "error",
  authenticated: hasGoogleCredentials(),
}));

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
