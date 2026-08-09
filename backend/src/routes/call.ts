import { Router } from "express";
import { createCallSession } from "../openai";
import { PERSONAS } from "../personas";
import type { PersonaId } from "../types";

export const callRouter = Router();

const MAX_INTERESTS = 10;
const MAX_INTEREST_LENGTH = 30;
const MAX_PLAN_LENGTH = 200;
const MAX_PREVIOUS_SUMMARY_LENGTH = 500;

function validateBody(
  body: unknown,
): (
  | { error: string }
  | { interests: string[]; plan: string; personaId?: PersonaId; previousSummary?: string }
) {
  const b = (body ?? {}) as Record<string, unknown>;

  const rawInterests = Array.isArray(b.interests) ? b.interests : [];
  if (rawInterests.length > MAX_INTERESTS) {
    return { error: `interests must have at most ${MAX_INTERESTS} items` };
  }
  const interests: string[] = [];
  for (const item of rawInterests) {
    if (typeof item !== "string" || item.length > MAX_INTEREST_LENGTH) {
      return { error: `each interest must be a string up to ${MAX_INTEREST_LENGTH} chars` };
    }
    interests.push(item);
  }

  const plan = typeof b.plan === "string" ? b.plan : "";
  if (plan.length > MAX_PLAN_LENGTH) {
    return { error: `plan must be at most ${MAX_PLAN_LENGTH} chars` };
  }

  if (b.personaId !== undefined) {
    if (typeof b.personaId !== "string" || !PERSONAS.some((p) => p.id === b.personaId)) {
      return { error: "invalid personaId" };
    }
  }

  let previousSummary: string | undefined;
  if (b.previousSummary !== undefined) {
    if (typeof b.previousSummary !== "string" || b.previousSummary.length > MAX_PREVIOUS_SUMMARY_LENGTH) {
      return { error: `previousSummary must be a string up to ${MAX_PREVIOUS_SUMMARY_LENGTH} chars` };
    }
    previousSummary = b.previousSummary;
  }

  return { interests, plan, personaId: b.personaId as PersonaId | undefined, previousSummary };
}

callRouter.post("/call", async (req, res) => {
  const validated = validateBody(req.body);
  if ("error" in validated) {
    res.status(400).json({ error: validated.error });
    return;
  }

  const result = await createCallSession(validated);

  if (!result.ok) {
    // Upstream OpenAI error bodies can contain internal detail — log server-side,
    // return a generic message to the client.
    console.error("realtime session creation failed", result.status, result.message);
    res.status(result.status).json({ error: "failed to create realtime session" });
    return;
  }

  res.status(200).json({
    client_secret: result.clientSecret,
    model: result.model,
  });
});
