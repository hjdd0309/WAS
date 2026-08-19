/**
 * 오디오 토큰 환산 비율 + 캐싱 여부를 실측으로 검증하기 위한 1회성 스크립트.
 * 짧은 사용자 발화 2개를 TTS로 합성해 같은 realtime 세션에 순서대로
 * input_audio로 주입하고, 매 턴 response.usage를 찍는다. 1턴째는 instructions
 * 전체를 처음 먹는 비용이 크고, 2턴째부터 캐싱(cached_tokens)이 얼마나
 * 깎아주는지가 "통화 전체 토큰 비용"을 추정하는 데 핵심이라 반드시 2턴 이상
 * 봐야 한다. 비용 최소화를 위해 딱 2턴만 본다.
 *
 * 실행: OPENAI_API_KEY=... npx tsx scripts/measure-audio-tokens.ts
 */
import "dotenv/config";
import WebSocket from "ws";
import { getPersona, DEFAULT_PERSONA_ID } from "../src/personas";
import { buildRealtimeInstructions } from "../src/realtimeInstructions";

const PCM_SAMPLE_RATE = 24000;
const PCM_BYTES_PER_SAMPLE = 2; // 16-bit mono

function pcmDurationSec(byteLength: number): number {
  return byteLength / (PCM_SAMPLE_RATE * PCM_BYTES_PER_SAMPLE);
}

async function synthesizeUserTurn(apiKey: string, text: string): Promise<Buffer> {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
      response_format: "pcm",
    }),
  });
  if (!res.ok) throw new Error(`TTS 합성 실패 (${res.status}): ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

function reportUsage(turnLabel: string, usage: any, inputSec: number, outputSec: number) {
  const inputAudioTokens = usage?.input_token_details?.audio_tokens;
  const outputAudioTokens = usage?.output_token_details?.audio_tokens;
  const cachedTokens = usage?.input_token_details?.cached_tokens;
  console.log(`\n--- ${turnLabel} 실측 ---`);
  console.log(`입력 오디오 ${inputSec.toFixed(2)}초 / 출력 오디오 ${outputSec.toFixed(2)}초`);
  console.log(`usage:`, JSON.stringify(usage, null, 2));
  if (inputAudioTokens && inputSec > 0) {
    console.log(`입력 오디오: ${(inputAudioTokens / inputSec).toFixed(1)} 토큰/초`);
  }
  if (outputAudioTokens && outputSec > 0) {
    console.log(`출력 오디오: ${(outputAudioTokens / outputSec).toFixed(1)} 토큰/초`);
  }
  console.log(`캐시된 토큰: ${cachedTokens ?? 0} / 이 턴 총 토큰: ${usage?.total_tokens}`);
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY가 없습니다.");
    process.exit(1);
  }

  const model = process.env.REALTIME_MODEL || "gpt-realtime";
  const persona = getPersona(DEFAULT_PERSONA_ID);
  const instructions = buildRealtimeInstructions(
    { interests: ["음악", "영화"], plan: "자격증 공부", personaId: persona.id },
    persona,
  );

  const turns = ["어 그냥 유튜브 보고 있었어", "몰라 그냥 봄"];
  const audioClips: Buffer[] = [];
  for (const text of turns) {
    console.log(`합성 중: "${text}"`);
    audioClips.push(await synthesizeUserTurn(apiKey, text));
  }
  const audioSecs = audioClips.map((b) => pcmDurationSec(b.length));
  console.log(`오디오 길이: ${audioSecs.map((s) => s.toFixed(2)).join("초, ")}초\n`);

  const socket = new WebSocket(`wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  let outputChunks: Buffer[] = [];
  let sessionReady = false;
  let turnIndex = 0;
  let cumulativeTotal = 0;

  function sendUserTurn(i: number) {
    outputChunks = [];
    socket.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_audio", audio: audioClips[i].toString("base64") }],
        },
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
          audio: {
            output: { voice: persona.voice },
            input: { turn_detection: null }, // 수동으로 턴을 넣을 거라 서버 VAD 끔
          },
          tools: [
            {
              type: "function",
              name: "end_call",
              description:
                "마무리 인사를 다 말한 다음 차례에, 통화를 실제로 종료할 때 호출해. 다른 말 없이 이 함수만 호출하면 돼.",
              parameters: { type: "object", properties: {}, additionalProperties: false },
            },
          ],
        },
      }),
    );
  });

  socket.on("message", (raw) => {
    const event = JSON.parse(raw.toString());

    switch (event.type) {
      case "session.updated": {
        if (sessionReady) break;
        sessionReady = true;
        console.log(`턴 ${turnIndex + 1} 오디오 주입...`);
        sendUserTurn(turnIndex);
        break;
      }
      case "response.output_audio.delta": {
        outputChunks.push(Buffer.from(event.delta, "base64"));
        break;
      }
      case "response.output_audio_transcript.delta": {
        process.stdout.write(event.delta ?? "");
        break;
      }
      case "response.done": {
        const outputAudio = Buffer.concat(outputChunks);
        const outputSec = pcmDurationSec(outputAudio.length);
        const usage = event.response?.usage;
        cumulativeTotal += usage?.total_tokens ?? 0;
        reportUsage(`턴 ${turnIndex + 1}`, usage, audioSecs[turnIndex], outputSec);

        turnIndex += 1;
        if (turnIndex < turns.length) {
          console.log(`\n턴 ${turnIndex + 1} 오디오 주입...`);
          sendUserTurn(turnIndex);
        } else {
          console.log(`\n=== 누적 총 토큰(${turns.length}턴): ${cumulativeTotal} ===`);
          socket.close();
          process.exit(0);
        }
        break;
      }
      case "error": {
        console.error("\n에러:", JSON.stringify(event.error, null, 2));
        socket.close();
        process.exit(1);
      }
      default:
        if (process.env.DEBUG_EVENTS) console.log(`[event] ${event.type}`);
        break;
    }
  });

  socket.on("error", (err) => {
    console.error("WebSocket 에러:", err.message);
    process.exit(1);
  });
}

main();
