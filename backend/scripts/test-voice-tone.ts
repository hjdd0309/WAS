/**
 * 3단계(음성 톤 확인)를 Realtime API 통화 없이 저렴하게 하기 위한 CLI.
 * OpenAI의 단발성 TTS 엔드포인트(/v1/audio/speech)로 문장 한두 줄만 음성으로
 * 변환한다 — 세션도, 대화 왕복도 없어서 실제 통화 테스트보다 훨씬 싸다.
 * gpt-4o-mini-tts는 instructions로 딜리버리 톤까지 지정할 수 있어서,
 * persona.styleGuide를 그대로 넣으면 실제 통화에 가까운 느낌을 들어볼 수 있다.
 *
 * 실행: npm run test:voice -- --text="지금 뭐 보고 있었어?"
 */
import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { getPersona, DEFAULT_PERSONA_ID } from "../src/personas";

const DEFAULT_TEXT = "지금 뭐 보고 있었어?";

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
  const persona = getPersona(args.get("persona") ?? DEFAULT_PERSONA_ID);
  const text = args.get("text") ?? DEFAULT_TEXT;
  const voice = args.get("voice") ?? persona.voice;
  const instructions = args.get("instructions") ?? persona.styleGuide;

  console.log(`--- 보이스: ${voice} (페르소나: ${persona.name}) ---`);
  console.log(`문장: "${text}"\n`);

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice,
      input: text,
      instructions,
      response_format: "mp3",
    }),
  });

  if (!res.ok) {
    console.error(`API 에러 (${res.status}):`, await res.text());
    process.exit(1);
  }

  const outDir = path.join(__dirname, ".tmp");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `voice-sample-${Date.now()}.mp3`);

  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(outPath, buffer);
  console.log(`저장됨: ${outPath}`);

  if (process.platform === "darwin") {
    console.log("재생 중...");
    spawn("afplay", [outPath], { stdio: "inherit" });
  } else {
    console.log("맥이 아니라 자동 재생은 생략 — 위 경로 파일을 직접 재생해줘.");
  }
}

main();
