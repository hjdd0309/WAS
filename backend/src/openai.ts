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

// gpt-realtime과 gpt-realtime-mini는 TPM(분당 토큰) 레이트리밋이 완전히
// 분리된 별개 버킷이라는 걸 실측으로 확인함(Tier 1 기준 각각 40,000 TPM —
// 합쳐서 80,000). 통화마다 랜덤으로 두 모델에 나눠 배정해서 사실상 그
// 80,000을 다 쓴다 — mini는 음성 인식 정확도가 살짝 떨어진다는 피드백이
// 있지만, 부스처럼 짧은 시간에 여러 통화가 몰릴 때 gpt-realtime 하나만
// 쓰다 429(rate_limit_exceeded)로 아예 못 받는 것보다 낫다는 트레이드오프.
const REALTIME_MODELS = ["gpt-realtime", "gpt-realtime-mini"];

// REALTIME_MODEL 환경변수를 설정하면 분산을 끄고 그 모델로 고정한다 —
// 특정 모델만 문제가 있을 때 재배포 없이 바로 우회할 수 있는 운영 비상용 스위치.
function pickRealtimeModel(): string {
  if (process.env.REALTIME_MODEL) return process.env.REALTIME_MODEL;
  return REALTIME_MODELS[Math.floor(Math.random() * REALTIME_MODELS.length)];
}

export async function createCallSession(
  body: Partial<OnboardingData>,
): Promise<CreateCallSessionResult | CreateCallSessionError> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = pickRealtimeModel();

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
          // 마무리 인사까지 마치면 AI가 스스로 통화를 종료하도록 하는 도구.
          // 프롬프트(realtimeInstructions.ts)에서 "마무리 멘트 다음 차례에만
          // 호출"하도록 지시한다. 클라이언트(useRealtimeCall.js)는 이 함수
          // 호출 이벤트를 감지해서 hangup()을 실행한다.
          tools: [
            {
              type: "function",
              name: "end_call",
              description:
                "마무리 인사를 다 말한 다음 차례에, 통화를 실제로 종료할 때 호출해. 다른 말 없이 이 함수만 호출하면 돼.",
              parameters: {
                type: "object",
                properties: {},
                additionalProperties: false,
              },
            },
          ],
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
