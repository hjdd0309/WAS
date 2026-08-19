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
import { spawn, spawnSync } from "node:child_process";
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
  const stamp = Date.now();
  const outPath = path.join(outDir, `voice-sample-${stamp}.mp3`);

  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(outPath, buffer);
  console.log(`저장됨: ${outPath}`);

  let playPath = outPath;

  const pitchSpeedArg = args.get("pitchSpeed");
  if (pitchSpeedArg) {
    const factor = Number(pitchSpeedArg);
    if (!Number.isFinite(factor) || factor <= 0) {
      console.error("--pitchSpeed는 0보다 큰 숫자여야 해 (예: 1.3)");
      process.exit(1);
    }
    playPath = applyPitchSpeed(outPath, factor, path.join(outDir, `voice-sample-${stamp}-x${factor}.mp3`));
  }

  const speedArg = args.get("speed");
  if (speedArg) {
    const factor = Number(speedArg);
    if (!Number.isFinite(factor) || factor < 0.5 || factor > 2.0) {
      console.error("--speed는 0.5~2.0 사이여야 해 (ffmpeg atempo 필터 제한, 예: 1.2)");
      process.exit(1);
    }
    playPath = applySpeed(playPath, factor, path.join(outDir, `voice-sample-${stamp}-speed${factor}.mp3`));
  }

  if (process.platform === "darwin") {
    console.log("재생 중...");
    spawn("afplay", [playPath], { stdio: "inherit" });
  } else {
    console.log("맥이 아니라 자동 재생은 생략 — 위 경로 파일을 직접 재생해줘.");
  }
}

// playbackRate를 올리는 것과 같은 효과 — 재생 속도와 피치를 함께 올려서
// "톰과 제리"/"미니언즈" 같은 확실한 어린아이/캐릭터 톤을 만든다.
// TTS 모델에게 말로 지시하는 것보다 훨씬 극적이고 확실한 효과.
function applyPitchSpeed(inputPath: string, factor: number, outputPath: string): string {
  const probe = spawnSync("ffprobe", [
    "-v", "error",
    "-select_streams", "a:0",
    "-show_entries", "stream=sample_rate",
    "-of", "csv=p=0",
    inputPath,
  ]);
  const sampleRate = Number(probe.stdout.toString().trim()) || 44100;
  const newRate = Math.round(sampleRate * factor);

  console.log(`피치/속도 ${factor}배 처리 중... (원본 ${sampleRate}Hz → ${newRate}Hz로 재해석)`);
  const result = spawnSync("ffmpeg", [
    "-y",
    "-i", inputPath,
    "-filter:a", `asetrate=${newRate},aresample=${sampleRate}`,
    outputPath,
  ]);

  if (result.status !== 0) {
    console.error("ffmpeg 처리 실패:", result.stderr?.toString());
    process.exit(1);
  }

  console.log(`저장됨(가공본): ${outputPath}`);
  return outputPath;
}

// atempo는 asetrate와 달리 피치는 그대로 두고 재생 속도만 바꾼다 —
// 목소리 톤은 안 변하고 그냥 말이 빨라지는/느려지는 느낌만 준다.
function applySpeed(inputPath: string, factor: number, outputPath: string): string {
  console.log(`속도 ${factor}배 처리 중... (피치 유지)`);
  const result = spawnSync("ffmpeg", [
    "-y",
    "-i", inputPath,
    "-filter:a", `atempo=${factor}`,
    outputPath,
  ]);

  if (result.status !== 0) {
    console.error("ffmpeg 처리 실패:", result.stderr?.toString());
    process.exit(1);
  }

  console.log(`저장됨(가공본): ${outputPath}`);
  return outputPath;
}

main();
