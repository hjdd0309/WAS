/**
 * 프롬프트(realtimeInstructions.ts)를 실제 Realtime 세션 없이 텍스트로 빠르게
 * 반복 튜닝하기 위한 CLI. Chat Completions는 오디오 토큰이 없어 Realtime API
 * 테스트 통화보다 훨씬 저렴하다 — 말투/재정향/마무리 흐름 같은 "내용" 검증은
 * 여기서 끝내고, end_call 타이밍처럼 세션에 더 밀접한 동작은 test:realtime으로
 * 한 번 더 확인하면 된다. 재정향/end_call 발생 여부는 checks.ts가 자동 감지해서
 * 알려주므로 대화 내용을 눈으로 다 훑지 않아도 된다.
 *
 * 실행: npm run test:prompt -- --persona=mom --plan="영어 공부" --interests="넷플릭스,러닝"
 */
import "dotenv/config";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { getPersona, DEFAULT_PERSONA_ID } from "../src/personas";
import { buildRealtimeInstructions } from "../src/realtimeInstructions";
import { createTestState, checkRedirect, checkEndCall, recordUsage, printSummary } from "./checks";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | null;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
};

const END_CALL_TOOL = {
  type: "function",
  function: {
    name: "end_call",
    description: "마무리 인사를 다 말한 직후, 통화를 실제로 종료할 때 호출해. 다른 말 없이 이 함수만 호출하면 돼.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
} as const;

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
  const model = process.env.TEST_CHAT_MODEL || "gpt-4o-mini";
  const persona = getPersona(args.get("persona") ?? DEFAULT_PERSONA_ID);
  const interests = (args.get("interests") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const plan = args.get("plan") ?? "";
  const previousSummary = args.get("previousSummary");

  const instructions = buildRealtimeInstructions(
    { interests, plan, personaId: persona.id, previousSummary },
    persona,
  );

  console.log(`--- 페르소나: ${persona.name} (${model}) ---`);
  console.log(`관심사: ${interests.join(", ") || "(없음)"} / 계획: ${plan || "(없음)"}`);
  console.log("Ctrl+C로 종료 (종료 시 재정향/end_call 요약 출력).\n");

  const history: ChatMessage[] = [{ role: "system", content: instructions }];
  const state = createTestState(plan);

  const rl = readline.createInterface({ input: stdin, output: stdout });
  rl.on("SIGINT", () => {
    printSummary(state);
    rl.close();
    process.exit(0);
  });

  // 실제 통화는 AI가 먼저 거는 구조이므로, 첫 턴은 유저 입력 없이 AI 시작 멘트를 먼저 받는다.
  await respond(history, apiKey, model, state);

  // end_call이 불리면 실제 통화도 거기서 끊기므로 시뮬레이션도 여기서 종료.
  // 계속 이어가면 tool_calls에 대한 tool 응답 메시지가 없어 다음 요청이
  // 400 에러("tool_calls must be followed by tool messages")로 실패한다.
  while (state.endCallTurn === null) {
    const userInput = await rl.question("나: ");
    if (!userInput.trim()) continue;
    history.push({ role: "user", content: userInput });
    await respond(history, apiKey, model, state);
  }

  console.log("[end_call로 통화 종료 — 시뮬레이션도 여기서 끝냅니다]");
  printSummary(state);
  rl.close();
  process.exit(0);
}

async function respond(history: ChatMessage[], apiKey: string, model: string, state: ReturnType<typeof createTestState>) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages: history, tools: [END_CALL_TOOL], temperature: 0.9 }),
  });

  if (!res.ok) {
    console.error(`API 에러 (${res.status}):`, await res.text());
    process.exit(1);
  }

  const data = (await res.json()) as {
    choices: { message: ChatMessage }[];
    usage?: { total_tokens?: number };
  };
  const message = data.choices[0]?.message;
  const reply = message?.content;

  history.push({
    role: "assistant",
    content: reply ?? null,
    ...(message?.tool_calls ? { tool_calls: message.tool_calls } : {}),
  });

  if (reply) {
    console.log(`AI: ${reply}\n`);
    checkRedirect(reply, state);
  }
  recordUsage(data.usage, state);

  if (message?.tool_calls?.some((tc) => tc.function.name === "end_call")) {
    checkEndCall(state);
  }

  state.turn += 1;
}

main();
