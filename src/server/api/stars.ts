import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { STAR_TYPES } from "../../shared/stars.js";
import * as starService from "../stars/star-service.js";

const setStarSchema = z.object({ star: z.enum(STAR_TYPES) });

function sendStarServiceError(reply: FastifyReply, error: unknown): void {
  if (error instanceof z.ZodError) {
    reply.code(400).send({ error: "validation", message: error.issues.map((issue) => issue.message).join("; ") });
    return;
  }
  throw error;
}

// Purely local, immediate (plan.md sections 10, 26) - no GT round trip.
export async function starsRoutes(app: FastifyInstance) {
  app.put<{ Params: { gtTaskId: string } }>("/api/tasks/:gtTaskId/star", async (request, reply) => {
    try {
      const { star } = setStarSchema.parse(request.body);
      await starService.setTaskStar(request.params.gtTaskId, star);
      return { star };
    } catch (error) {
      sendStarServiceError(reply, error);
      return;
    }
  });

  app.delete<{ Params: { gtTaskId: string } }>("/api/tasks/:gtTaskId/star", async (request, reply) => {
    await starService.removeTaskStar(request.params.gtTaskId);
    reply.code(204);
    return null;
  });
}
