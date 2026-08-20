// crypto.randomUUID()는 보안 컨텍스트(HTTPS 또는 localhost)에서만 존재한다.
// LAN IP + HTTP로 접속하는 폰 실기기 테스트(Safari)에서는 이 함수 자체가 없어서
// 호출 시점에 앱이 죽는다 — 이 앱의 id는 암호학적 안전성이 필요 없으므로
// 못 쓸 때는 조용히 대체 생성기로 넘어간다.
export function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      // 보안 컨텍스트가 아니어서 던지는 경우 — 아래 대체 경로로 진행
    }
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
