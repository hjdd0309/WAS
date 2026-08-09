export type PersonaId = "bestie" | "tsundere" | "auntie" | "hype";

export interface OnboardingData {
  interests: string[];
  plan: string;
  personaId: PersonaId;
  /**
   * 프론트가 localStorage에 쌓아둔, 이전 통화들의 짧은 요약. DB 없이
   * "여러 번 통화해도 기억하는" 느낌을 주기 위한 것 — 백엔드는 이 텍스트를
   * 그대로 프롬프트에 반영할 뿐 저장/영속화하지 않는다.
   */
  previousSummary?: string;
}
