// 백엔드(backend/src/personas.ts)와 id를 반드시 맞춰야 하는 페르소나 목록.
// 통화 중에는 이 이름이 실제 "발신자 이름"으로 보여져야 하며(예: "이모"),
// "WAS" 같은 서비스명은 통화 화면에 절대 노출하지 않는다 — 친구가 건 전화처럼
// 느껴지게 하는 것이 이 서비스의 핵심 설계 의도.
export const PERSONAS = [
  {
    id: 'bestie',
    name: '여보세요',
    emoji: '🙂',
    tagline: '다정한 베프',
    description: '편한 반말로 다정하게',
  },
  {
    id: 'tsundere',
    name: '까칠이',
    emoji: '😤',
    tagline: '츤데레 절친',
    description: '까칠해 보여도 속은 다정하게',
  },
  {
    id: 'auntie',
    name: '이모',
    emoji: '🧡',
    tagline: '오지랖 넓은 이모',
    description: '존댓말로 살갑게 챙기며',
  },
  {
    id: 'hype',
    name: '후배',
    emoji: '⚡',
    tagline: '텐션 높은 후배',
    description: '발랄하고 리액션 크게',
  },
]

export const DEFAULT_PERSONA_ID = 'bestie'

export function getPersona(id) {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0]
}
