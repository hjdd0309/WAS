/**
 * 실제 부스 상황을 흉내낸 동시성 한계 테스트. N개의 realtime 세션을 동시에
 * 열고, 각 세션이 진짜 통화처럼 여러 턴(오프너 → 사용자 응답 두 번)을
 * 주고받게 한 뒤, 몇 개까지 버티는지/어디서 429(rate limit)가 나는지를
 * 직접 관찰한다. TPM은 "분당 누적"이라 짧은 통화 여러 개가 겹치는 실제
 * 패턴으로 재봐야 의미가 있어서, 계산이 아니라 실측으로 확인한다.
 *
 * 실행: OPENAI_API_KEY=... REALTIME_MODEL=gpt-realtime CONCURRENCY=5 npx tsx scripts/concurrent-load-test.ts
 */
import "dotenv/config";
import WebSocket from "ws";
import { getPersona, DEFAULT_PERSONA_ID } from "../src/personas";
import { buildRealtimeInstructions } from "../src/realtimeInstructions";

const TURNS_PER_CALL = 2; // 오프너 포함 총 3턴(오프너+사용자2회 응답) 흉내
// 실제 통화는 AI 오디오 재생 + 사용자가 듣고 대답하는 시간이 있어 턴 사이에
// 공백이 있다(30~50초 통화 목표 기준 턴당 대략 이 정도). 이전 테스트는 이
// 텀 없이 전부 몰아쳐서 실제보다 더 가혹한 순간 버스트였다 — TPM은 60초
// 롤링 윈도우라 턴을 실제 페이스로 흩뿌리면 순간 부하가 줄어들 수 있다.
const TURN_DELAY_MS = Number(process.env.TURN_DELAY_MS || "7000");

async function synthesize(apiKey: string, text: string): Promise<Buffer> {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini-tts", voice: "alloy", input: text, response_format: "pcm" }),
  });
  if (!res.ok) throw new Error(`TTS 실패 (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

interface CallResult {
  id: number;
  status: "ok" | "error";
  errorCode?: string | number;
  errorMessage?: string;
  totalTokens: number;
  turnsCompleted: number;
  elapsedMs: number;
}

function runOneCall(
  id: number,
  apiKey: string,
  model: string,
  instructions: string,
  voice: string,
  userAudioClips: Buffer[],
): Promise<CallResult> {
  return new Promise((resolve) => {
    const started = Date.now();
    let totalTokens = 0;
    let turnsCompleted = 0;
    let settled = false;

    const finish = (status: "ok" | "error", errorCode?: string | number, errorMessage?: string) => {
      if (settled) return;
      settled = true;
      try {
        socket.close();
      } catch {
        // ignore
      }
      resolve({ id, status, errorCode, errorMessage, totalTokens, turnsCompleted, elapsedMs: Date.now() - started });
    };

    const socket = new WebSocket(`wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const perCallTimeoutMs = TURN_DELAY_MS * (TURNS_PER_CALL + 1) + 30_000;
    const timeout = setTimeout(() => finish("error", "timeout", `${perCallTimeoutMs}ms 타임아웃`), perCallTimeoutMs);

    socket.on("open", () => {
      socket.send(
        JSON.stringify({
          type: "session.update",
          session: {
            type: "realtime",
            model,
            instructions,
            audio: { output: { voice }, input: { turn_detection: null } },
            tools: [
              {
                type: "function",
                name: "end_call",
                description: "마무리 인사를 다 말한 다음 차례에, 통화를 실제로 종료할 때 호출해.",
                parameters: { type: "object", properties: {}, additionalProperties: false },
              },
            ],
          },
        }),
      );
    });

    socket.on("message", (raw) => {
      let event: any;
      try {
        event = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (event.type === "session.updated") {
        socket.send(JSON.stringify({ type: "response.create" })); // 오프너
        return;
      }

      if (event.type === "response.done") {
        const respStatus = event.response?.status;
        const usageTokens = event.response?.usage?.total_tokens ?? 0;
        totalTokens += usageTokens;
        turnsCompleted += 1;
        if (respStatus !== "completed") {
          console.log(
            `  [#${id}] 턴 ${turnsCompleted} status=${respStatus} usage=${usageTokens} detail=${JSON.stringify(event.response?.status_details)}`,
          );
        }

        if (turnsCompleted <= TURNS_PER_CALL) {
          const clip = userAudioClips[(turnsCompleted - 1) % userAudioClips.length];
          setTimeout(() => {
            if (settled) return;
            socket.send(
              JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "message",
                  role: "user",
                  content: [{ type: "input_audio", audio: clip.toString("base64") }],
                },
              }),
            );
            socket.send(JSON.stringify({ type: "response.create" }));
          }, TURN_DELAY_MS);
        } else {
          clearTimeout(timeout);
          finish("ok");
        }
        return;
      }

      if (event.type === "error") {
        clearTimeout(timeout);
        finish("error", event.error?.code ?? event.error?.type, event.error?.message);
      }
    });

    socket.on("error", (err) => {
      clearTimeout(timeout);
      finish("error", "ws_error", err.message);
    });

    socket.on("unexpected-response", (_req, res) => {
      clearTimeout(timeout);
      finish("error", res.statusCode, "unexpected-response");
    });
  });
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY가 없습니다.");
    process.exit(1);
  }

  const model = process.env.REALTIME_MODEL || "gpt-realtime";
  const concurrency = Number(process.env.CONCURRENCY || "5");
  const persona = getPersona(DEFAULT_PERSONA_ID);
  const instructions = buildRealtimeInstructions(
    { interests: ["음악", "영화"], plan: "자격증 공부", personaId: persona.id },
    persona,
  );

  console.log(`모델: ${model} / 동시 통화 수: ${concurrency}`);
  console.log("사용자 발화 오디오 합성 중...");
  const userAudioClips = await Promise.all(
    ["어 그냥 유튜브 보고 있었어", "몰라 그냥 봄"].map((t) => synthesize(apiKey, t)),
  );

  console.log(`동시 ${concurrency}개 통화 시작...\n`);
  const started = Date.now();
  const results = await Promise.all(
    Array.from({ length: concurrency }, (_, i) => runOneCall(i + 1, apiKey, model, instructions, persona.voice, userAudioClips)),
  );
  const elapsed = Date.now() - started;

  const ok = results.filter((r) => r.status === "ok");
  const failed = results.filter((r) => r.status === "error");

  console.log("--- 결과 ---");
  for (const r of results) {
    if (r.status === "ok") {
      console.log(`  [#${r.id}] 성공 — ${r.turnsCompleted}턴, ${r.totalTokens}토큰, ${r.elapsedMs}ms`);
    } else {
      console.log(`  [#${r.id}] 실패 — code=${r.errorCode} "${r.errorMessage}" (${r.turnsCompleted}턴 완료 후, ${r.elapsedMs}ms)`);
    }
  }

  console.log(`\n성공 ${ok.length}/${concurrency}, 실패 ${failed.length}/${concurrency}`);
  console.log(`총 소요 시간: ${elapsed}ms`);
  console.log(`성공한 통화들의 총 토큰 합: ${ok.reduce((s, r) => s + r.totalTokens, 0)}`);
  if (failed.length > 0) {
    const codes = [...new Set(failed.map((r) => r.errorCode))];
    console.log(`실패 원인 코드: ${codes.join(", ")}`);
  }
}

main();
