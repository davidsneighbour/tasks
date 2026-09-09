import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { LABEL_COLOURS, LABEL_ICON_NAMES } from "../../shared/labels.js";
import * as labelService from "../labels/label-service.js";

const createLabelSchema = z.object({
  name: z.string().min(1),
  colour: z.enum(LABEL_COLOURS),
  icon: z.enum(LABEL_ICON_NAMES),
});

const updateLabelSchema = z.object({
  name: z.string().min(1).optional(),
  colour: z.enum(LABEL_COLOURS).optional(),
  icon: z.enum(LABEL_ICON_NAMES).optional(),
});

const setTaskLabelsSchema = z.object({
  labelIds: z.array(z.number().int()),
});

function sendLabelServiceError(reply: FastifyReply, error: unknown): void {
  if (error instanceof z.ZodError) {
    reply.code(400).send({ error: "validation", message: error.issues.map((issue) => issue.message).join("; ") });
    return;
  }
  if (error instanceof labelService.LabelNotFoundError) {
    reply.code(404).send({ error: "not-found", message: error.message });
    return;
  }
  throw error;
}

// Purely local CRUD - labels have no GT counterpart, so there is no GoogleApiError path here
// (plan.md section 9).
export async function labelsRoutes(app: FastifyInstance) {
  app.get("/api/labels", async () => ({ labels: await labelService.listLabels() }));

  app.post("/api/labels", async (request, reply) => {
    try {
      const input = createLabelSchema.parse(request.body);
      const label = await labelService.createLabel(input);
      reply.code(201);
      return { label };
    } catch (error) {
      sendLabelServiceError(reply, error);
      return;
    }
  });

  app.patch<{ Params: { labelId: string } }>("/api/labels/:labelId", async (request, reply) => {
    try {
      const input = updateLabelSchema.parse(request.body);
      const label = await labelService.updateLabel(Number(request.params.labelId), input);
      return { label };
    } catch (error) {
      sendLabelServiceError(reply, error);
      return;
    }
  });

  app.delete<{ Params: { labelId: string } }>("/api/labels/:labelId", async (request, reply) => {
    try {
      await labelService.deleteLabel(Number(request.params.labelId));
      reply.code(204);
      return null;
    } catch (error) {
      sendLabelServiceError(reply, error);
      return;
    }
  });

  app.put<{ Params: { gtTaskId: string } }>("/api/tasks/:gtTaskId/labels", async (request, reply) => {
    try {
      const input = setTaskLabelsSchema.parse(request.body);
      const taskLabels = await labelService.setTaskLabels(request.params.gtTaskId, input.labelIds);
      return { labels: taskLabels };
    } catch (error) {
      sendLabelServiceError(reply, error);
      return;
    }
  });
}
