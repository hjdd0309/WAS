import type { OnboardingData } from "./types";
import { getPersona } from "./personas";
import { buildRealtimeInstructions } from "./realtimeInstructions";

export interface CreateCallSessionResult {
  ok: true;
  clientSecret: string;
  model: string;
}

export interface CreateCallSessionError {
  ok: false;
  status: number;
  message: string;
}

export async function createCallSession(
  body: Partial<OnboardingData>,
): Promise<CreateCallSessionResult | CreateCallSessionError> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.REALTIME_MODEL || "gpt-realtime";

  if (!apiKey) {
    return { ok: false, status: 501, message: "OPENAI_API_KEY not configured" };
  }

  const interests = Array.isArray(body.interests) ? body.interests : [];
  const plan = typeof body.plan === "string" ? body.plan : "";
  const previousSummary = typeof body.previousSummary === "string" ? body.previousSummary : undefined;
  const persona = getPersona(body.personaId);
  const voice = persona.voice || process.env.REALTIME_VOICE || "verse";

  const instructions = buildRealtimeInstructions(
    { interests, plan, personaId: persona.id, previousSummary },
    persona,
  );

  try {
    const upstream = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model,
          instructions,
          audio: {
            output: { voice },
            input: {
              transcription: { model: "whisper-1" },
              turn_detection: {
                type: "server_vad",
                silence_duration_ms: 700,
                // 스피커 사용 시 마이크가 AI 목소리를 다시 주워서 응답이 겹치는 걸
                // 막기 위해 자동 인터럽트/자동 응답 생성을 끔. 응답 트리거는
                // 클라이언트(useRealtimeCall.ts)가 직접 함.
                interrupt_response: false,
                create_response: false,
              },
            },
          },
        },
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return { ok: false, status: upstream.status, message: text };
    }

    const data = (await upstream.json()) as { value?: string };
    if (!data.value) {
      return { ok: false, status: 502, message: "OpenAI response missing client secret" };
    }

    return { ok: true, clientSecret: data.value, model };
  } catch (err) {
    return {
      ok: false,
      status: 500,
      message: err instanceof Error ? err.message : "realtime session request failed",
    };
  }
}
