// 백엔드(backend/src/personas.ts)와 id를 반드시 맞춰야 하는 페르소나 목록.
// 통화 중에는 이 이름이 실제 "발신자 이름"으로 보여져야 하며, "잠깐만/WAS" 같은
// 서비스명은 통화 화면에 절대 노출하지 않는다 — 아는 사람이 건 전화처럼
// 느껴지게 하는 것이 이 서비스의 핵심 설계 의도.
export const PERSONAS = [
  {
    id: 'mom',
    name: '엄마',
    emoji: '👩',
    tagline: '다정한 잔소리 엄마',
    description: '다정한 존댓말로 살갑게 챙기며',
  },
  {
    id: 'collegeFriend',
    name: '대학생 여사친',
    emoji: '👩‍🎓',
    tagline: '발랄한 여사친',
    description: '편한 반말로 텐션 높게',
  },
  {
    id: 'grandma',
    name: '잔소리 할머니',
    emoji: '👵',
    tagline: '정겨운 잔소리 할머니',
    description: '구수한 존댓말로 정겹게',
  },
  {
    id: 'churchBro',
    name: '교회 오빠',
    emoji: '🙏',
    tagline: '다정한 교회 오빠',
    description: '차분한 존댓말로 다정하게',
  },
  {
    id: 'trainer',
    name: '헬스 트레이너',
    emoji: '💪',
    tagline: '텐션 높은 트레이너',
    description: '활기찬 반말로 파이팅 넘치게',
  },
  {
    id: 'tsundereBro',
    name: '츤데레 남사친',
    emoji: '😤',
    tagline: '까칠한 츤데레 남사친',
    description: '무심한 척해도 속은 다정하게',
  },
]

export const DEFAULT_PERSONA_ID = 'mom'

export function getPersona(id) {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0]
}
