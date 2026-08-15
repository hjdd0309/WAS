/**
 * 2단계: Realtime API 세션을 실제로 열되 오디오 없이 텍스트로만 주고받는 CLI.
 * 1단계(test-prompt.ts, Chat Completions)에서 말투/흐름을 다 다듬은 뒤,
 * end_call 같은 "Realtime 세션 고유 동작"(도구 호출, 세션 설정)만 여기서
 * 저렴하게 확인한다. 오디오 토큰이 안 붙으니 실제 통화보다 훨씬 싸다.
 *
 * end_call 도구는 현재 프로덕션 코드(openai.ts)에 없는 상태라(git stash로
 * 되돌림) 이 스크립트에 별도로 정의해뒀다 — 되살리려면 `git stash pop`.
 *
 * 실행: npm run test:realtime -- --persona=mom --plan="영어 공부" --interests="넷플릭스,러닝"
 */
import "dotenv/config";
import WebSocket from "ws";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { getPersona, DEFAULT_PERSONA_ID } from "../src/personas";
import { buildRealtimeInstructions } from "../src/realtimeInstructions";

function parseArgs() {
  const args = new Map<string, string>();
  for (const raw of process.argv.slice(2)) {
    const match = raw.match(/^--([^=]+)=(.*)$/);
    if (match) args.set(match[1], match[2]);
  }
  return args;
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY가 .env에 없습니다.");
    process.exit(1);
  }

  const args = parseArgs();
  const model = process.env.REALTIME_MODEL || "gpt-realtime";
  const persona = getPersona(args.get("persona") ?? DEFAULT_PERSONA_ID);
  const interests = (args.get("interests") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const plan = args.get("plan") ?? "";
  const previousSummary = args.get("previousSummary");

  const instructions = buildRealtimeInstructions(
    { interests, plan, personaId: persona.id, previousSummary },
    persona,
  );

  console.log(`--- 페르소나: ${persona.name} (${model}, text-only) ---`);
  console.log(`관심사: ${interests.join(", ") || "(없음)"} / 계획: ${plan || "(없음)"}`);
  console.log("Ctrl+C로 종료.\n");

  const rl = readline.createInterface({ input: stdin, output: stdout });
  const socket = new WebSocket(`wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  socket.on("open", () => {
    socket.send(
      JSON.stringify({
        type: "session.update",
        session: {
          type: "realtime",
          model,
          instructions,
          modalities: ["text"],
          tools: [
            {
              type: "function",
              name: "end_call",
              description:
                "마무리 인사를 다 말한 직후, 통화를 실제로 종료할 때 호출해. 다른 말 없이 이 함수만 호출하면 돼.",
              parameters: { type: "object", properties: {}, additionalProperties: false },
            },
          ],
        },
      }),
    );
    // AI가 먼저 거는 통화 구조이므로 유저 입력 없이 첫 응답을 바로 트리거.
    socket.send(JSON.stringify({ type: "response.create" }));
  });

  socket.on("message", async (raw) => {
    const event = JSON.parse(raw.toString());

    switch (event.type) {
      case "response.output_text.delta":
        stdout.write(event.delta);
        break;
      case "response.output_item.done": {
        const item = event.item;
        if (item?.type === "function_call" && item?.name === "end_call") {
          console.log("\n[end_call 호출 감지 — 이 시점에 실제 통화라면 hangup() 실행됨]");
        }
        break;
      }
      case "response.done": {
        const userInput = await rl.question("\n나: ");
        socket.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: { type: "message", role: "user", content: [{ type: "input_text", text: userInput }] },
          }),
        );
        socket.send(JSON.stringify({ type: "response.create" }));
        break;
      }
      case "error":
        console.error("\n에러:", event.error);
        break;
      default:
        // 예상 못 한 이벤트 타입이 오면(API 스펙 변경 등) 원인 파악용으로 그대로 출력.
        if (process.env.DEBUG_EVENTS) console.log(`\n[event] ${event.type}`);
        break;
    }
  });

  socket.on("error", (err) => {
    console.error("WebSocket 에러:", err.message);
    process.exit(1);
  });

  socket.on("close", (code, reason) => {
    console.log(`\n연결 종료 (${code}) ${reason?.toString() ?? ""}`);
    process.exit(0);
  });
}

main();
