import { getPersona } from "./personas";
import type { UserProfile } from "./types";

const MAX_LENGTH = 60;
const DEFAULT_MODEL = "gpt-4o-mini";

// realtimeInstructions.ts와 같은 제약(AI 티 내지 않기, 훈계 금지, 캐릭터 톤 유지)을
// 문자 한 통짜리로 압축한 프롬프트. Realtime 음성 모델과 달리 텍스트 한 줄만
// 필요하므로 훨씬 저렴한 일반 채팅 모델을 쓴다.
function buildPrompt(profile: UserProfile, personaId: string | undefined): string {
  const persona = getPersona(personaId);
  const interestList = profile.interests.length > 0 ? profile.interests.join(", ") : "특별히 정해진 건 없음";
  const plan = profile.plan || "특별히 없음";

  return `너는 "${persona.name}"라는 이름의, 사용자와 원래 친한 사이야. 지금 사용자에게 짧은 문자(카카오톡 메시지 느낌)를 하나 보내려고 해 — 잠시 후 전화를 걸기 직전에 보내는, "나 지금 전화해도 돼?" 느낌의 가벼운 예고 문자야.

[절대 하지 말 것]
- AI, 인공지능, 프로그램, 알림이라는 사실 언급 금지.
- 스크린타임, 폰 사용 습관, "그만 봐" 같은 훈계나 잔소리 금지.
- 너무 정중하거나 격식 있는 문장 금지 — 진짜 사람이 편하게 보낸 문자처럼.

[참고 정보 — 필요할 때만 자연스럽게 녹여서, 매번 그대로 언급하지는 말 것]
- 사용자 관심사: ${interestList}
- 사용자가 요즘 하려는 일/계획: ${plan}

[말투]
${persona.styleGuide}

[출력 규칙]
문장 1개, 15자~${MAX_LENGTH}자 사이. 이모티콘은 0~1개만. 따옴표나 설명 없이 문자 내용 그 자체만 출력해.`;
}

/**
 * 저장된 프로필을 바탕으로 "친구가 보낸 것 같은" 짧은 알림 문구를 하나 생성한다.
 * 발송 경로(POST /api/push/send)에서 직접 호출하지 않고, 프로필 저장 시점에
 * 미리 만들어 캐싱해둔다 — 알림이 뜨는 순간 LLM 지연이 끼지 않게 하기 위함.
 * 실패하면 null을 반환하고, 호출부는 이전 캐시값을 그대로 두면 된다.
 */
export async function generateNotificationText(
  profile: UserProfile,
  personaId: string | undefined,
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.NOTIFICATION_TEXT_MODEL || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6_000);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: buildPrompt(profile, personaId) }],
        max_tokens: 60,
        temperature: 1,
      }),
    });

    if (!res.ok) {
      console.error("notification text generation failed", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text ? text.slice(0, MAX_LENGTH) : null;
  } catch (err) {
    console.error("notification text generation error", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
