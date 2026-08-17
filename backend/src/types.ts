export type PersonaId = "whispy";

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
  /**
   * 프론트가 /api/call 요청에 직접 담아 보내지 않는 필드 — call.ts가 KV
   * 프로필에서 항상 채워 넣는다(루틴은 /api/profile로만 저장/갱신되고 통화
   * 요청 body에는 원래 없음).
   */
  routines?: Routine[];
}

export interface Routine {
  id: string;
  label: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/**
 * userid(x-user-id 헤더)별로 KV에 저장되는 프로필 전체. 로그인 없는 익명
 * 사용자 단위 메모리 — call 세션 컨텍스트 백필과 푸시 알림 생성에 쓰인다.
 */
export interface UserProfile {
  interests: string[];
  plan: string;
  personaId?: PersonaId;
  routines?: Routine[];
  previousSummary?: string;
  /** 다음 알림 발송 시 바로 쓸 수 있도록 미리 생성해둔 문구. */
  pendingNotificationText?: string;
  pushSubscription?: PushSubscriptionData;
  updatedAt: number;
}
