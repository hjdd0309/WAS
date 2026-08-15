import { Router } from "express";
import { getProfile, saveProfile } from "../kv";
import { generateNotificationText } from "../notificationText";
import { PERSONAS } from "../personas";
import type { PersonaId, Routine } from "../types";

export const profileRouter = Router();

const MAX_INTERESTS = 10;
const MAX_INTEREST_LENGTH = 30;
const MAX_PLAN_LENGTH = 200;
const MAX_ROUTINES = 20;
const MAX_ROUTINE_LABEL_LENGTH = 20;

interface ValidBody {
  interests?: string[];
  plan?: string;
  personaId?: PersonaId;
  routines?: Routine[];
}

function validateBody(body: unknown): { error: string } | ValidBody {
  const b = (body ?? {}) as Record<string, unknown>;
  const result: ValidBody = {};

  if (b.interests !== undefined) {
    if (!Array.isArray(b.interests) || b.interests.length > MAX_INTERESTS) {
      return { error: `interests must be an array of at most ${MAX_INTERESTS} items` };
    }
    const interests: string[] = [];
    for (const item of b.interests) {
      if (typeof item !== "string" || item.length > MAX_INTEREST_LENGTH) {
        return { error: `each interest must be a string up to ${MAX_INTEREST_LENGTH} chars` };
      }
      interests.push(item);
    }
    result.interests = interests;
  }

  if (b.plan !== undefined) {
    if (typeof b.plan !== "string" || b.plan.length > MAX_PLAN_LENGTH) {
      return { error: `plan must be a string up to ${MAX_PLAN_LENGTH} chars` };
    }
    result.plan = b.plan;
  }

  if (b.personaId !== undefined) {
    if (typeof b.personaId !== "string" || !PERSONAS.some((p) => p.id === b.personaId)) {
      return { error: "invalid personaId" };
    }
    result.personaId = b.personaId as PersonaId;
  }

  if (b.routines !== undefined) {
    if (!Array.isArray(b.routines) || b.routines.length > MAX_ROUTINES) {
      return { error: `routines must be an array of at most ${MAX_ROUTINES} items` };
    }
    const routines: Routine[] = [];
    for (const item of b.routines) {
      const r = item as Record<string, unknown>;
      if (
        typeof r.id !== "string" ||
        typeof r.label !== "string" ||
        r.label.length > MAX_ROUTINE_LABEL_LENGTH
      ) {
        return { error: `each routine needs id and label (label up to ${MAX_ROUTINE_LABEL_LENGTH} chars)` };
      }
      routines.push({ id: r.id, label: r.label });
    }
    result.routines = routines;
  }

  return result;
}

profileRouter.post("/profile", async (req, res) => {
  const userId = req.header("x-user-id");
  if (!userId) {
    res.status(400).json({ error: "x-user-id header required" });
    return;
  }

  const validated = validateBody(req.body);
  if ("error" in validated) {
    res.status(400).json({ error: validated.error });
    return;
  }

  const profile = await saveProfile(userId, validated);
  res.status(200).json({ ok: true });

  // 응답을 막지 않고, 다음 알림 발송 때 바로 쓸 문구를 미리 만들어 캐싱해둔다
  // (push.ts의 /api/push/send가 이 값을 읽는다). 실패해도 조용히 무시 —
  // 다음 저장 시점이나 발송 후 재생성 때 다시 시도된다.
  void generateNotificationText(profile, profile.personaId)
    .then((text) => {
      if (text) return saveProfile(userId, { pendingNotificationText: text });
    })
    .catch((err) => console.error("failed to refresh pending notification text", err));
});

profileRouter.get("/profile", async (req, res) => {
  const userId = req.header("x-user-id");
  if (!userId) {
    res.status(400).json({ error: "x-user-id header required" });
    return;
  }

  const profile = await getProfile(userId);
  res.status(200).json({ profile });
});
