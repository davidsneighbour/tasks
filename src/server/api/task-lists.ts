import type { FastifyInstance } from "fastify";
import { GoogleApiError, MissingGoogleCredentialsError, googleTasksClient, httpStatusForGoogleApiError } from "../google/index.js";

export async function taskListsRoutes(app: FastifyInstance) {
  app.get("/api/task-lists", async (_request, reply) => {
    try {
      const taskLists = await googleTasksClient.listTaskLists();
      return { taskLists };
    } catch (error) {
      if (error instanceof GoogleApiError) {
        reply.code(httpStatusForGoogleApiError(error)).send({ error: error.kind, message: error.message });
        return;
      }
      if (error instanceof MissingGoogleCredentialsError) {
        reply.code(401).send({ error: "authentication", message: error.message });
        return;
      }
      throw error;
    }
  });
}
