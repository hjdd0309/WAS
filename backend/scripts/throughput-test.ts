/**
 * "1분에 몇 명을 감당할 수 있는가" 처리량(throughput) 실측 테스트.
 * 매 순간 다 몰아치는 게 아니라, ARRIVAL_INTERVAL_MS 간격으로 신규 통화가
 * 계속 들어오는 걸 흉내낸다(부스에 사람이 꾸준히 오는 상황). 각 통화는
 * openai.ts와 동일하게 gpt-realtime/gpt-realtime-mini에 랜덤 분산 배정되고,
 * 턴 사이에 실제 대화 페이스(TURN_DELAY_MS)를 흉내낸 지연을 둔다.
 *
 * TPM은 60초 롤링 윈도우라 처음 60초는 "가득 찬 예산을 까먹는" 과도 구간이고,
 * 그 이후(정상상태)에 실패율이 안정되는 게 진짜 지속가능한 처리량이다 —
 * 그래서 TEST_DURATION_MS를 최소 90~120초로 잡아야 의미가 있다.
 *
 * 실행 예:
 *   OPENAI_API_KEY=... ARRIVAL_INTERVAL_MS=8000 TEST_DURATION_MS=120000 TURN_DELAY_MS=7000 \
 *     npx tsx scripts/throughput-test.ts
 */
import "dotenv/config";
import WebSocket from "ws";
import { getPersona, DEFAULT_PERSONA_ID } from "../src/personas";
import { buildRealtimeInstructions } from "../src/realtimeInstructions";

// 강제로 N턴에 끊지 않고, 모델이 스스로 end_call을 호출할 때까지 자연스러운
// 대화를 흘려보낸다(full-call-measurement.ts와 동일 시나리오) — 실측 결과
// 평균 통화가 3턴이 아니라 4턴/14,000토큰대였던 걸 반영해 처리량을 다시 잰다.
const SAFETY_CAP_TURNS = 8;
const USER_TURNS = [
  "어 그냥 유튜브 보고 있었어",
  "그냥 이것저것 보고 있었어, 별 내용 없어",
  "음 몰라, 아직 딱히 생각 안 해봤어",
  "어 그럴까 그럼",
  "응 알겠어",
  "어 그래 고마워",
];
const REALTIME_MODELS = ["gpt-realtime", "gpt-realtime-mini"];

// 완전 랜덤은 동시에 여러 통화가 몰릴 때 우연히 한쪽 모델에 쏠릴 수 있다
// (실측으로 확인 — 4개 중 3개가 gpt-realtime에 몰려서 그 버킷만 넘침).
// 번갈아 배정(라운드로빈)으로 이 쏠림 자체를 없애본다.
let roundRobinIndex = 0;
function pickModel(): string {
  const model = REALTIME_MODELS[roundRobinIndex % REALTIME_MODELS.length];
  roundRobinIndex += 1;
  return model;
}

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
  model: string;
  arrivedAtMs: number; // 테스트 시작 기준 상대 시각
  fullyOk: boolean; // 모든 턴이 실제로 성공했는지(429 없이)
  reachedEndCall: boolean; // 모델이 스스로 end_call을 호출했는지
  turnsOk: number;
  turnsFailed: number;
  totalTokens: number;
  durationSec: number;
}

function runOneCall(
  id: number,
  arrivedAtMs: number,
  apiKey: string,
  model: string,
  instructions: string,
  voice: string,
  userAudioClips: Buffer[],
  turnDelayMs: number,
): Promise<CallResult> {
  return new Promise((resolve) => {
    const callStarted = Date.now();
    let totalTokens = 0;
    let turnsOk = 0;
    let turnsFailed = 0;
    let turnsSeen = 0;
    let userTurnIndex = 0;
    let endCallSeen = false;
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      try {
        socket.close();
      } catch {
        // ignore
      }
      resolve({
        id,
        model,
        arrivedAtMs,
        fullyOk: turnsFailed === 0,
        reachedEndCall: endCallSeen,
        turnsOk,
        turnsFailed,
        totalTokens,
        durationSec: (Date.now() - callStarted) / 1000,
      });
    };

    const socket = new WebSocket(`wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const perCallTimeoutMs = turnDelayMs * (SAFETY_CAP_TURNS + 1) + 30_000;
    const timeout = setTimeout(finish, perCallTimeoutMs);

    function sendNextUserTurn() {
      if (settled) return;
      if (userTurnIndex >= userAudioClips.length) {
        finish();
        return;
      }
      const clip = userAudioClips[userTurnIndex];
      userTurnIndex += 1;
      socket.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: { type: "message", role: "user", content: [{ type: "input_audio", audio: clip.toString("base64") }] },
        }),
      );
      socket.send(JSON.stringify({ type: "response.create" }));
    }

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

      if (event.type === "response.output_item.done") {
        const item = event.item;
        if (item?.type === "function_call" && item?.name === "end_call") {
          endCallSeen = true;
        }
        return;
      }

      if (event.type === "response.done") {
        turnsSeen += 1;
        const respStatus = event.response?.status;
        const usageTokens = event.response?.usage?.total_tokens ?? 0;
        totalTokens += usageTokens;
        if (respStatus === "completed") {
          turnsOk += 1;
        } else {
          turnsFailed += 1;
        }

        if (endCallSeen || turnsSeen >= SAFETY_CAP_TURNS) {
          finish();
        } else {
          setTimeout(sendNextUserTurn, turnDelayMs);
        }
        return;
      }

      if (event.type === "error") {
        turnsFailed += 1;
        finish();
      }
    });

    socket.on("error", () => {
      turnsFailed += 1;
      finish();
    });
  });
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY가 없습니다.");
    process.exit(1);
  }

  const arrivalIntervalMs = Number(process.env.ARRIVAL_INTERVAL_MS || "8000");
  const testDurationMs = Number(process.env.TEST_DURATION_MS || "120000");
  const turnDelayMs = Number(process.env.TURN_DELAY_MS || "7000");

  const persona = getPersona(DEFAULT_PERSONA_ID);
  const instructions = buildRealtimeInstructions(
    { interests: ["음악", "영화"], plan: "자격증 공부", personaId: persona.id },
    persona,
  );

  console.log(`도착 간격: ${arrivalIntervalMs}ms (분당 ${(60000 / arrivalIntervalMs).toFixed(1)}명 시도)`);
  console.log(`테스트 길이: ${testDurationMs / 1000}초 / 턴 간 지연: ${turnDelayMs}ms\n`);
  console.log("사용자 발화 오디오 합성 중...");
  const userAudioClips = await Promise.all(USER_TURNS.map((t) => synthesize(apiKey, t)));

  const started = Date.now();
  const pending: Promise<CallResult>[] = [];
  let id = 0;

  console.log("\n부하 시작...\n");
  await new Promise<void>((resolveArrivals) => {
    const arrivalTimer = setInterval(() => {
      const now = Date.now() - started;
      if (now >= testDurationMs) {
        clearInterval(arrivalTimer);
        resolveArrivals();
        return;
      }
      id += 1;
      const model = pickModel();
      console.log(`  [t=${(now / 1000).toFixed(1)}s] 통화 #${id} 시작 (${model})`);
      pending.push(runOneCall(id, now, apiKey, model, instructions, persona.voice, userAudioClips, turnDelayMs));
    }, arrivalIntervalMs);
  });

  console.log("\n모든 통화 도착 완료 — 진행 중인 통화들 종료 대기...\n");
  const results = await Promise.all(pending);

  console.log("--- 개별 결과 ---");
  for (const r of results) {
    const mark = r.fullyOk ? "✅" : "⚠️";
    const endMark = r.reachedEndCall ? "" : " [end_call 못 봄]";
    console.log(
      `  ${mark} [t=${(r.arrivedAtMs / 1000).toFixed(1)}s #${r.id}] ${r.model} — 턴 ${r.turnsOk + r.turnsFailed}(성공 ${r.turnsOk}), ${r.totalTokens}토큰, ${r.durationSec.toFixed(1)}초${endMark}`,
    );
  }

  const fullyOk = results.filter((r) => r.fullyOk);
  const degraded = results.filter((r) => !r.fullyOk);
  const byModel = (m: string) => results.filter((r) => r.model === m);

  const avgTokens = results.reduce((s, r) => s + r.totalTokens, 0) / results.length;
  const avgTurns = results.reduce((s, r) => s + r.turnsOk + r.turnsFailed, 0) / results.length;
  const notEndCall = results.filter((r) => !r.reachedEndCall).length;

  console.log("\n--- 요약 ---");
  console.log(`총 시도: ${results.length}건 (목표 ${(60000 / arrivalIntervalMs).toFixed(1)}/분 기준 ${(testDurationMs / 60000).toFixed(1)}분간)`);
  console.log(`완전 성공: ${fullyOk.length}건 / 일부 턴 실패: ${degraded.length}건 / end_call 못 본 건: ${notEndCall}건`);
  console.log(`평균 통화당: ${avgTurns.toFixed(1)}턴, ${avgTokens.toFixed(0)}토큰`);
  console.log(`실측 분당 완전 성공 처리량: ${(fullyOk.length / (testDurationMs / 60000)).toFixed(2)}명/분`);
  for (const m of REALTIME_MODELS) {
    const calls = byModel(m);
    const ok = calls.filter((r) => r.fullyOk).length;
    console.log(`  ${m}: 시도 ${calls.length}, 완전성공 ${ok}, 토큰합 ${calls.reduce((s, r) => s + r.totalTokens, 0)}`);
  }
}

main();
