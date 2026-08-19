/**
 * "실제 통화 흐름(진입→전개→재정향→마무리+end_call)이 몇 턴/몇 초/몇 토큰에
 * 끝나는가"를 강제 종료 없이 실측한다. 미리 짜둔 사용자 발화를 순서대로
 * 흘려보내되, 모델이 end_call을 스스로 호출하면 즉시 멈춘다(호출 안 하면
 * SAFETY_CAP_TURNS에서 강제 중단). 턴 사이엔 실제 대화 페이스(TURN_DELAY_MS)
 * 지연을 둔다 — 총 소요 시간이 30~50초 목표에 실제로 맞는지도 같이 본다.
 *
 * 실행: OPENAI_API_KEY=... REALTIME_MODEL=gpt-realtime TURN_DELAY_MS=5000 \
 *   npx tsx scripts/full-call-measurement.ts
 */
import "dotenv/config";
import WebSocket from "ws";
import { getPersona, DEFAULT_PERSONA_ID } from "../src/personas";
import { buildRealtimeInstructions } from "../src/realtimeInstructions";

const SAFETY_CAP_TURNS = 8; // end_call이 끝까지 안 오면 여기서 강제 중단(비용 안전장치)

// "해야겠다" 같은 즉시 종료 트리거를 피하고, 재정향 질문까지 자연스럽게
// 흘러가도록 짠 시나리오 — 평균적인(즉시 의지 표현 없는) 케이스를 보기 위함.
const USER_TURNS = [
  "어 그냥 유튜브 보고 있었어",
  "그냥 이것저것 보고 있었어, 별 내용 없어",
  "음 몰라, 아직 딱히 생각 안 해봤어",
  "어 그럴까 그럼",
];

async function synthesize(apiKey: string, text: string): Promise<Buffer> {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini-tts", voice: "alloy", input: text, response_format: "pcm" }),
  });
  if (!res.ok) throw new Error(`TTS 실패 (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

function pcmDurationSec(byteLength: number): number {
  return byteLength / (24000 * 2);
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY가 없습니다.");
    process.exit(1);
  }

  const model = process.env.REALTIME_MODEL || "gpt-realtime";
  const turnDelayMs = Number(process.env.TURN_DELAY_MS || "5000");
  const persona = getPersona(DEFAULT_PERSONA_ID);
  const instructions = buildRealtimeInstructions(
    { interests: ["음악", "영화"], plan: "자격증 공부", personaId: persona.id },
    persona,
  );

  console.log(`모델: ${model} / 턴 간 지연: ${turnDelayMs}ms\n`);
  console.log("사용자 발화 합성 중...");
  const userClips = await Promise.all(USER_TURNS.map((t) => synthesize(apiKey, t)));
  console.log("완료\n");

  const socket = new WebSocket(`wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const started = Date.now();
  let userTurnIndex = 0;
  let aiTurnCount = 0;
  let cumulativeTokens = 0;
  let endCallSeen = false;

  function sendNextUserTurn() {
    if (userTurnIndex >= userClips.length) {
      console.log("\n(준비된 사용자 발화를 다 썼음 — 그래도 end_call이 안 왔으면 여기서 중단)");
      finish("사용자 발화 소진");
      return;
    }
    const clip = userClips[userTurnIndex];
    console.log(`\n[t=${((Date.now() - started) / 1000).toFixed(1)}s] 사용자: "${USER_TURNS[userTurnIndex]}" (${pcmDurationSec(clip.length).toFixed(1)}초)`);
    userTurnIndex += 1;
    socket.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: { type: "message", role: "user", content: [{ type: "input_audio", audio: clip.toString("base64") }] },
      }),
    );
    socket.send(JSON.stringify({ type: "response.create" }));
  }

  function finish(reason: string) {
    const elapsed = (Date.now() - started) / 1000;
    console.log(`\n=== 종료: ${reason} ===`);
    console.log(`AI 턴 수: ${aiTurnCount} (end_call 호출: ${endCallSeen ? "예" : "아니오"})`);
    console.log(`총 소요 시간: ${elapsed.toFixed(1)}초`);
    console.log(`누적 토큰: ${cumulativeTokens}`);
    try {
      socket.close();
    } catch {
      // ignore
    }
    process.exit(0);
  }

  socket.on("open", () => {
    socket.send(
      JSON.stringify({
        type: "session.update",
        session: {
          type: "realtime",
          model,
          instructions,
          audio: { output: { voice: persona.voice }, input: { turn_detection: null } },
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
    const event: any = JSON.parse(raw.toString());

    if (event.type === "session.updated") {
      socket.send(JSON.stringify({ type: "response.create" })); // 오프너
      return;
    }

    if (event.type === "response.output_audio_transcript.delta") {
      process.stdout.write(event.delta ?? "");
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
      aiTurnCount += 1;
      cumulativeTokens += event.response?.usage?.total_tokens ?? 0;
      console.log(`  [턴 ${aiTurnCount} 완료, 누적 ${cumulativeTokens}토큰]`);

      if (endCallSeen) {
        finish("모델이 end_call 호출");
        return;
      }
      if (aiTurnCount >= SAFETY_CAP_TURNS) {
        finish(`안전장치 — ${SAFETY_CAP_TURNS}턴 넘음`);
        return;
      }
      setTimeout(sendNextUserTurn, turnDelayMs);
      return;
    }

    if (event.type === "error") {
      console.error("\n에러:", JSON.stringify(event.error));
      finish("에러");
    }
  });

  socket.on("error", (err) => {
    console.error("WebSocket 에러:", err.message);
    process.exit(1);
  });
}

main();
