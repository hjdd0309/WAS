import { getPersona } from "./personas";
import type { UserProfile } from "./types";

const MAX_LENGTH = 60;
// 문자 한 줄만 생성하면 되므로 가벼운 모델로 고정 — 환경변수로 바꿔 쓰지 못하게 함.
// gpt-4.1-nano는 조직 사용량 티어에서 모델별 하루 요청 한도(RPD)가 낮게
// 걸려있어(50/day) 반복 테스트만으로 금방 소진됐다 — 더 널리 쓰이는
// gpt-4o-mini로 바꿔 같은 티어에서도 훨씬 높은 기본 한도를 받는다.
const MODEL = "gpt-4o-mini";

// 매번 무작위로 하나를 골라 프롬프트에 강제 지정한다 — nano처럼 작은 모델은
// "다양하게 써줘" 같은 느슨한 지시만으로는 결국 비슷한 패턴으로 수렴하는
// 경향이 있어서, 서버 쪽에서 직접 진입 유형을 정해 매번 다른 구조로
// 시작하도록 강제하는 편이 훨씬 확실하다(realtimeInstructions.ts의 통화
// [진입 방식]과 같은 접근).
// "지금 뭐 하고 있어요?" 축(=지금 이 순간 뭐 하는지 묻는 것) 하나로 통일하고,
// 그 안에서 구조만 다르게 바리에이션을 준다 — 예고형/리액션형처럼 축 자체가
// 다른 유형은 "네 생각나서 전화했어요" 류의 어색한 이유 설명으로 새는 경향이
// 있어서 뺐다.
// 예시 문장은 전부 [말투] 섹션과 같은 존댓말 톤으로 맞춰뒀다 — 예시가 반말이면
// 작은 모델이 [말투] 지시보다 예시의 표면적 어투를 그대로 따라가버려서, 생성될
// 때마다 존댓말/반말이 뒤섞이는 원인이 된다(실제로 발생했던 문제).
const OPENING_STYLES = [
  '가장 짧고 직접적으로. "지금 뭐 해요?" 처럼.',
  '지금 하는 행동을 구체적으로 짚어서. "지금 뭐 보고 있어요?" 처럼.',
  '과거형으로 살짝 바꿔서. "지금 뭐 하고 있었어요?" 처럼.',
  '어순을 뒤집어서. "뭐 하고 있어요, 지금?" 처럼.',
  '진행 상황을 묻는 느낌으로. "지금 뭐 하는 중이에요?" 처럼.',
  '가벼운 안부 인사로. "안녕! 잘 지내고 있어요?" 처럼 — 단순한 안부여도 문자를 받는 순간 스스로를 의식하게 만드는 효과가 있음.',
] as const;

// realtimeInstructions.ts와 같은 전제(AI라는 걸 숨기지 않음, 훈계 금지, 캐릭터
// 톤 유지)를 문자 한 통짜리로 압축한 프롬프트. Realtime 음성 모델과 달리
// 텍스트 한 줄만 필요하므로 훨씬 저렴한 일반 채팅 모델을 쓴다.
function buildPrompt(profile: UserProfile, personaId: string | undefined): string {
  const persona = getPersona(personaId);
  const interestList = profile.interests.length > 0 ? profile.interests.join(", ") : "특별히 정해진 건 없음";
  const plan = profile.plan || "특별히 없음";
  const openingStyle = OPENING_STYLES[Math.floor(Math.random() * OPENING_STYLES.length)];

  return `너는 "${persona.name}"라는 이름의 AI 동반자야. 사용자가 숏폼 콘텐츠를 계속 넘겨보고 있는 걸 감지해서, 잠시 후 전화하기 직전에 짧은 문자(카카오톡 메시지 느낌) 한 통을 먼저 보내려고 해 — 지금 뭐 하고 있는지 가볍게 묻는 안부 문자야. 사용자는 네가 AI라는 것도, 스크린타임을 도와주는 역할이라는 것도 이미 알고 있어 — 숨길 필요 없어, 다만 그 사실을 문자에서 굳이 설명하거나 티낼 필요도 없어.

[이번엔 반드시 이 유형으로 시작할 것]
${openingStyle}
예시 문장은 "이런 식으로 말을 거는 구조"를 보여주는 참고용일 뿐이니 그대로 베끼지 말고, 단어 선택과 문장 구조를 새롭게 바꿔서 써. 예시 문장의 말투(존댓말/반말)는 무시하고, 실제 말투는 반드시 아래 [말투] 섹션만 따를 것 — 문장 구조와 말투는 서로 다른 지시이니 섞지 말 것. 전화 거는 이유를 그럴듯하게 지어내지 마("네 생각나서", "여유 좀 내보려고" 같은 핑계·이유 설명 문장 금지 — 실제 한국어 문자에서 안 쓰는 어색한 번역투야) — 그냥 담백하게 말 걸면 돼.

[절대 하지 말 것]
- "전화", "통화", "call" 등 전화를 걸겠다는 언급 금지. "나 지금 전화해도 돼?", "잠시 후에 전화할게", "이따 통화해요" 같은 문장 쓰지 마 — 이 문자는 곧 전화가 온다는 걸 예고하는 게 아니라, 그냥 지금 뭐 하고 있는지 묻는 문자여야 해.
- 반드시 존댓말만 쓸 것. "~했어?", "~하고 있어?" 같은 반말 어미 금지 — 아래 [말투] 지시를 따르되 존댓말(해요체) 밖으로 나가지 마.
- 훈계, 잔소리, "그만 봐" 같은 명령조 금지. 판단하거나 다그치지 마.
- 너무 정중하거나 격식 있는 문장 금지 — 편하게 보낸 문자처럼.
- "조용히", "속삭이듯", "작게 말할게" 같이 목소리 톤/전달 방식에 대한
  표현은 텍스트 문자에 어울리지 않으니 쓰지 말 것.
- "음", "어", "아 근데", "그니까" 같은 추임새 쓰지 마. 깔끔하게 바로 본론으로.
- "잠깐"이라는 단어 쓰지 마 ("잠깐 시간 괜찮으면" 등 전부 금지).
- "안녕"으로 매번 시작하지 마.
- 문어체·번역투 표현 쓰지 마. 실제 한국인이 친구한테 문자 보낼 때 쓰는 자연스러운 구어체만 써. 예: "요즘 뭐하고 있었어요?"(X, 어색함) → "요즘 뭐하고 지내요?"(O). 문장을 쓸 때마다 "이거 실제로 문자에 진짜 이렇게 쓰나?" 스스로 점검해.

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
  const result = await generateNotificationTextDebug(profile, personaId);
  return result.text;
}

// generateNotificationText와 로직은 같지만 실패 사유를 함께 반환한다.
// preview-text 라우트가 이걸로 디버깅 중 — Vercel 로그 접근 없이도 응답
// 본문(Network 탭)에서 바로 실패 원인을 볼 수 있게 하기 위한 임시 조치.
// 원인 파악 끝나면 이 함수를 걷어내고 generateNotificationText 본문에
// 로직을 다시 합쳐도 된다.
export async function generateNotificationTextDebug(
  profile: UserProfile,
  personaId: string | undefined,
): Promise<{ text: string | null; debugError?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { text: null, debugError: "OPENAI_API_KEY not set" };

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
      const errText = await res.text();
      console.error("notification text generation failed", res.status, errText);
      return { text: null, debugError: `HTTP ${res.status}: ${errText.slice(0, 300)}` };
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    return { text: text ? text.slice(0, MAX_LENGTH) : null, debugError: text ? undefined : "empty completion" };
  } catch (err) {
    console.error("notification text generation error", err);
    return { text: null, debugError: err instanceof Error ? `${err.name}: ${err.message}` : String(err) };
  } finally {
    clearTimeout(timeout);
  }
}
