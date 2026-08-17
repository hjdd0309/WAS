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
  // 비용/속도 때문에 무조건 mini 고정 — 환경변수로 바꿔 쓰지 못하게 함.
  const model = "gpt-realtime-mini";

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

  // OpenAI 쪽이 드물게 느려지거나 멈추면 이 fetch에 타임아웃이 없어서 Vercel
  // 함수 타임아웃(기본 10초)에 그대로 끌려가 지저분한 504가 나간다. 8초로
  // 먼저 끊어서 우리 쪽에서 깔끔한 에러로 처리한다.
  const timeoutMs = 8_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstream = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      signal: controller.signal,
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
              turn_detection: {
                type: "server_vad",
                silence_duration_ms: 700,
                // 사용자가 AI 말 도중에 끼어들면(barge-in) 서버가 진행 중인 응답을
                // 자동으로 취소하도록 위임한다. 응답 생성 트리거 자체는 여전히
                // 클라이언트(useRealtimeCall.js)가 speech_stopped 시점에 직접 함.
                interrupt_response: true,
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
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, status: 504, message: `OpenAI realtime session request timed out after ${timeoutMs}ms` };
    }
    return {
      ok: false,
      status: 500,
      message: err instanceof Error ? err.message : "realtime session request failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}
