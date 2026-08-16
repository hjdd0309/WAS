// 백엔드(backend/src/personas.ts)와 id를 반드시 맞춰야 하는 페르소나 목록.
// 통화 중에는 이 이름이 실제 "발신자 이름"으로 보여져야 하며, "잠깐만/WAS" 같은
// 서비스명은 통화 화면에 절대 노출하지 않는다 — 아는 사람이 건 전화처럼
// 느껴지게 하는 것이 이 서비스의 핵심 설계 의도.
export const PERSONAS = [
  {
    id: 'whispy',
    name: '위스피',
    emoji: '👻',
    tagline: '곁에 있는 동반자',
    description: '편안한 존댓말로',
  },
]

export const DEFAULT_PERSONA_ID = 'whispy'

export function getPersona(id) {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0]
}
