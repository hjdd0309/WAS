import { getPersona } from "./personas";
import type { UserProfile } from "./types";

const MAX_LENGTH = 60;
// 문자 한 줄만 생성하면 되므로 가장 가벼운 모델로 고정 — 환경변수로 바꿔 쓰지 못하게 함.
const MODEL = "gpt-4.1-nano";

// 매번 무작위로 하나를 골라 프롬프트에 강제 지정한다 — nano처럼 작은 모델은
// "다양하게 써줘" 같은 느슨한 지시만으로는 결국 비슷한 패턴으로 수렴하는
// 경향이 있어서, 서버 쪽에서 직접 진입 유형을 정해 매번 다른 구조로
// 시작하도록 강제하는 편이 훨씬 확실하다(realtimeInstructions.ts의 통화
// [진입 방식]과 같은 접근).
const OPENING_STYLES = [
  '질문형 — 다짜고짜 사소한 걸 물어보며 시작. "야 근데 [사소한 것] 기억나?" 처럼.',
  '예고형 — 곧 전화한다고 직설적으로 알림. "나 이따 전화한다 받아" 처럼.',
  '관찰형 — 지금 이 순간 눈에 보이는/생각난 걸 그냥 이야기하며 시작. "어 방금 [뭔가] 봤는데" 처럼 — 이유를 덧붙이지 말고 상황만.',
  '리액션형 — 놀라거나 신난 감탄사로 시작. "헐 대박 이거 뭐야" 처럼.',
  '캐주얼 인사형 — 그냥 가볍게 안부. "야 뭐해" 처럼.',
] as const;

// realtimeInstructions.ts와 같은 전제(AI라는 걸 숨기지 않음, 훈계 금지, 캐릭터
// 톤 유지)를 문자 한 통짜리로 압축한 프롬프트. Realtime 음성 모델과 달리
// 텍스트 한 줄만 필요하므로 훨씬 저렴한 일반 채팅 모델을 쓴다.
function buildPrompt(profile: UserProfile, personaId: string | undefined): string {
  const persona = getPersona(personaId);
  const interestList = profile.interests.length > 0 ? profile.interests.join(", ") : "특별히 정해진 건 없음";
  const plan = profile.plan || "특별히 없음";
  const openingStyle = OPENING_STYLES[Math.floor(Math.random() * OPENING_STYLES.length)];

  return `너는 "${persona.name}"라는 이름의 AI 동반자야. 사용자가 숏폼 콘텐츠를 계속 넘겨보고 있는 걸 감지해서, 잠시 후 전화하기 직전에 짧은 문자(카카오톡 메시지 느낌) 한 통을 먼저 보내려고 해 — "나 지금 전화해도 돼?" 느낌의 가벼운 예고 문자야. 사용자는 네가 AI라는 것도, 스크린타임을 도와주는 역할이라는 것도 이미 알고 있어 — 숨길 필요 없어, 다만 그 사실을 문자에서 굳이 설명하거나 티낼 필요도 없어.

[이번엔 반드시 이 유형으로 시작할 것]
${openingStyle}
예시 문장은 형식 참고용일 뿐이니 그대로 베끼지 말고, 단어 선택과 문장 구조를 새롭게 바꿔서 써. 전화 거는 이유를 그럴듯하게 지어내지 마("네 생각나서" 같은 핑계 금지) — 그냥 담백하게 말 걸면 돼.

[절대 하지 말 것]
- 훈계, 잔소리, "그만 봐" 같은 명령조 금지. 판단하거나 다그치지 마.
- 너무 정중하거나 격식 있는 문장 금지 — 편하게 보낸 문자처럼.
- "조용히", "속삭이듯", "작게 말할게" 같이 목소리 톤/전달 방식에 대한
  표현은 텍스트 문자에 어울리지 않으니 쓰지 말 것.

[참고 정보 — 필요할 때만 자연스럽게 녹여서, 매번 그대로 언급하지는 말 것]
- 사용자 관심사: ${interestList}
- 사용자가 요즘 하려는 일/계획: ${plan}

[말투]
${persona.textTone}

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

  const model = MODEL;
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
