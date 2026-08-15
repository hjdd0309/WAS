/**
 * 프롬프트(realtimeInstructions.ts)를 실제 Realtime 세션 없이 텍스트로 빠르게
 * 반복 튜닝하기 위한 CLI. Chat Completions는 오디오 토큰이 없어 Realtime API
 * 테스트 통화보다 훨씬 저렴하다 — 말투/재정향/마무리 흐름 같은 "내용" 검증은
 * 여기서 끝내고, end_call 타이밍 같은 Realtime 세션 고유 동작만 실제 세션으로
 * 확인하면 된다.
 *
 * 실행: npm run test:prompt -- --persona=mom --plan="영어 공부" --interests="넷플릭스,러닝"
 */
import "dotenv/config";
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
  console.log("Ctrl+C로 종료.\n");

  const history: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: instructions },
  ];

  const rl = readline.createInterface({ input: stdin, output: stdout });

  // 실제 통화는 AI가 먼저 거는 구조이므로, 첫 턴은 유저 입력 없이 AI 시작 멘트를 먼저 받는다.
  await respond(history, apiKey, model);

  while (true) {
    const userInput = await rl.question("나: ");
    if (!userInput.trim()) continue;
    history.push({ role: "user", content: userInput });
    await respond(history, apiKey, model);
  }
}

async function respond(
  history: { role: "system" | "user" | "assistant"; content: string }[],
  apiKey: string,
  model: string,
) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages: history, temperature: 0.9 }),
  });

  if (!res.ok) {
    console.error(`API 에러 (${res.status}):`, await res.text());
    process.exit(1);
  }

  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  const reply = data.choices[0]?.message.content ?? "(응답 없음)";
  history.push({ role: "assistant", content: reply });
  console.log(`AI: ${reply}\n`);
}

main();
