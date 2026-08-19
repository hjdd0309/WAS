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
import { createTestState, checkRedirect, checkEndCall, recordUsage, printSummary } from "./checks";

// frontend/src/hooks/useRealtimeCall.js와 동일한 텍스트 — 실제 통화에서는
// 매 사용자 턴이 끝날 때마다 이 리마인더를 시스템 메시지로 재주입해서 톤/
// 재정향 지시를 다시 상기시킨다. 이게 없으면 텍스트 시뮬레이션이 실제
// 통화보다 프롬프트 준수율이 낮게 나와 결과가 왜곡된다. frontend 쪽 문구가
// 바뀌면 이것도 같이 맞춰야 한다.
const TONE_REMINDER =
  '[내부 지시 — 사용자에게 보이지 않음] 지금까지의 텐션과 존댓말 톤을 그대로 유지해. 문장을 딱딱하거나 완벽하게 다듬지 말고, 추임새(음, 어, 그니까)를 섞어서 편하게 대답해. 방금 전에 썼던 표현이나 문장 구조를 반복하지 말고 새롭게 말해. 반말("뭐 해?", "봤어?")로 새지 말고 반드시 존댓말("뭐 해요?", "봤어요?")로 끝낼 것 — 대화가 길어질수록 반말로 흘러가는 경향이 있으니 매번 스스로 점검해. 그렇다고 "여쭤봐도 될까요?", "~해주실 수 있나요" 처럼 지나치게 격식체로 넘어가지도 마 — 친한 사이에 편하게 쓰는 존댓말("뭐 해요?", "봤어요?")이 목표지, 공손하고 딱딱한 존댓말이 아니야. 사용자가 반말로 짧게 답해도("ㅇㅇ", "몰라") 절대 따라서 반말 쓰지 말고 네 존댓말 톤을 계속 유지해.';

function buildPlanReminder(plan: string): string {
  if (!plan) return "";
  return `\n\n[내부 지시 — 사용자에게 보이지 않음] 사용자가 요즘 하려는 일: "${plan}". 이 통화에서 이걸 단 한 번도 언급한 적이 없다면, 이번 응답이나 다음 응답에서 반드시 가볍게 물어봐("저번에 말한 ○○ 어떻게 됐어?" 식으로) — 뭉뚱그려서 "다른 계획 있어?"처럼 묻지 말고 반드시 위 구체적인 내용으로.
이미 한 번 물어봤는데 사용자가 "몰라"/"그냥"처럼 애매하게 얼버무리기만 했다면(명확한 거부의 말이 없어도), 그것도 이 얘기를 더 하고 싶지 않다는 신호로 받아들여 — 절대 말을 바꿔서 다시 캐묻지 마. 가볍게 받아주고 마무리로 넘어가.
이미 한 번 언급했는데 사용자가 힘들다/어렵다/괴롭다/짜증난다 같은 부정적 감정을 명확히 말로 표현했다면(단순 얼버무림과 다름), 절대 다시 캐묻지 말고 먼저 공감·위로부터 해(다독여주는 톤) — 그 다음에야 딱 한 번, 아까와 다른 부드러운 말투로 살짝만 다시 챙겨봐("천천히 해도 되니까 조금이라도 해볼 수 있겠어요?" 식으로). 이 부드러운 재시도에도 "됐어요"/"말고"/"그만 물어봐요" 같은 명확한 거부든, 또 애매하게 얼버무리는 반응이든 오면 그 뒤로는 절대 다시 꺼내지 마.
이미 (최초 질문 + 부드러운 재시도) 두 번 다 다뤘거나, 사용자가 거부·회피 신호를 보였다면, 그 이후로는 절대 다시 묻거나 언급하지 말고 그냥 자연스럽게 흘러가.`;
}

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
  const model = process.env.REALTIME_MODEL || "gpt-realtime-mini";
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
  console.log("Ctrl+C로 종료 (종료 시 재정향/end_call 요약 출력).\n");

  const state = createTestState(plan);
  let currentText = "";

  const socket = new WebSocket(`wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const rl = readline.createInterface({ input: stdin, output: stdout });
  rl.on("SIGINT", () => {
    printSummary(state);
    rl.close();
    socket.close();
    process.exit(0);
  });

  socket.on("open", () => {
    socket.send(
      JSON.stringify({
        type: "session.update",
        session: {
          type: "realtime",
          model,
          instructions,
          output_modalities: ["text"],
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
    // AI가 먼저 거는 통화 구조이므로 유저 입력 없이 첫 응답을 바로 트리거.
    socket.send(JSON.stringify({ type: "response.create" }));
  });

  socket.on("message", async (raw) => {
    const event = JSON.parse(raw.toString());

    switch (event.type) {
      case "response.output_text.delta":
        stdout.write(event.delta);
        currentText += event.delta;
        break;
      case "response.output_text.done":
        checkRedirect(currentText, state);
        currentText = "";
        break;
      case "response.output_item.done": {
        const item = event.item;
        if (item?.type === "function_call" && item?.name === "end_call") {
          checkEndCall(state);
          console.log("[end_call 호출 — 실제 통화라면 여기서 hangup() 실행됨. 시뮬레이션도 종료]");
          printSummary(state);
          rl.close();
          socket.close();
          process.exit(0);
        }
        break;
      }
      case "response.done": {
        recordUsage(event.response?.usage, state);
        state.turn += 1;
        const userInput = await rl.question("\n나: ");
        socket.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: { type: "message", role: "user", content: [{ type: "input_text", text: userInput }] },
          }),
        );
        // 실제 통화(useRealtimeCall.js)와 동일하게, 매 사용자 턴 직후 톤/재정향
        // 리마인더를 시스템 메시지로 재주입한 다음 response.create를 보낸다.
        socket.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "message",
              role: "system",
              content: [{ type: "input_text", text: TONE_REMINDER + buildPlanReminder(plan) }],
            },
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
    printSummary(state);
    process.exit(0);
  });
}

main();
