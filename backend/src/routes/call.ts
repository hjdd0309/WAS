import { Router } from "express";
import { createCallSession } from "../openai";
import { PERSONAS } from "../personas";
import { getProfile, saveProfile } from "../kv";
import type { PersonaId, Routine } from "../types";

export const callRouter = Router();

const MAX_INTERESTS = 10;
const MAX_INTEREST_LENGTH = 30;
const MAX_PLAN_LENGTH = 200;
const MAX_PREVIOUS_SUMMARY_LENGTH = 500;

function validateBody(
  body: unknown,
): (
  | { error: string }
  | { interests: string[]; plan: string; personaId?: PersonaId; previousSummary?: string; routines?: Routine[] }
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

  // 프론트가 매번 컨텍스트를 직접 실어 보내지 않아도(예: 새 기기, localStorage
  // 비움) 서버가 userid로 KV 프로필을 조회해 빈 필드를 채운다 — 프론트가 값을
  // 보냈다면 그게 항상 우선(즉시 반영된 최신 상태일 수 있으므로).
  const userId = req.header("x-user-id");
  if (userId) {
    const profile = await getProfile(userId);
    if (profile) {
      if (validated.interests.length === 0 && profile.interests.length > 0) {
        validated.interests = profile.interests;
      }
      if (!validated.plan && profile.plan) {
        validated.plan = profile.plan;
      }
      if (!validated.personaId && profile.personaId) {
        validated.personaId = profile.personaId;
      }
      if (!validated.previousSummary && profile.previousSummary) {
        validated.previousSummary = profile.previousSummary;
      }
      // 루틴은 /api/profile로만 저장되고 프론트가 /api/call body에 애초에
      // 담아 보내지 않는 필드라, 여기서 항상 KV 값으로 채운다(우선순위 비교 불필요).
      if (profile.routines && profile.routines.length > 0) {
        validated.routines = profile.routines;
      }
    }
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

// 통화 종료 후 프론트가 뽑아낸 짧은 요약(CallSplash.deriveSummary)을 서버
// 메모리에도 남긴다 — 지금은 프론트가 localStorage previousSummary로도 들고
// 있지만, 다른 기기/새로고침 이후에도 이어지려면 서버가 진실 소스여야 한다.
callRouter.post("/call/summary", async (req, res) => {
  const userId = req.header("x-user-id");
  if (!userId) {
    res.status(400).json({ error: "x-user-id header required" });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const summary = typeof body.summary === "string" ? body.summary : "";
  if (summary.length > MAX_PREVIOUS_SUMMARY_LENGTH) {
    res.status(400).json({ error: `summary must be at most ${MAX_PREVIOUS_SUMMARY_LENGTH} chars` });
    return;
  }

  await saveProfile(userId, { previousSummary: summary });
  res.status(200).json({ ok: true });
});
