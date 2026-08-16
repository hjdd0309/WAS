import { API_BASE, baseHeaders } from './api'

// 홈 화면에 머무는 동안 통화 세션을 미리 하나 받아둔다 — 실제로 통화
// 버튼을 누르는 순간 이게 아직 같은 프로필로 만들어진 것이면 /api/call
// 왕복을 건너뛸 수 있다. 관심사/계획/페르소나가 바뀌면(=이 세션에 이미
// 박혀있는 instructions가 낡은 것이 되면) key가 달라져 재사용하지 않는다.
let cached = null // { key, clientSecret }
let pendingKey = null // 지금 발급 요청이 진행 중인 key — 같은 조합으로 중복 요청 안 나가게 막는 용도

function payloadKey(payload) {
  return JSON.stringify({
    interests: payload.interests ?? [],
    plan: payload.plan ?? '',
    personaId: payload.personaId,
    previousSummary: payload.previousSummary || '',
  })
}

export async function fetchCallSession(payload) {
  return fetch(`${API_BASE}/api/call`, {
    method: 'POST',
    headers: baseHeaders(),
    body: JSON.stringify({
      interests: payload.interests ?? [],
      plan: payload.plan ?? '',
      personaId: payload.personaId,
      previousSummary: payload.previousSummary || undefined,
    }),
  })
}

export function prefetchCallSession(payload) {
  const key = payloadKey(payload)
  // 이미 같은 조합으로 준비돼 있거나(cached), 지금 한창 발급받는 중이면(pendingKey)
  // 또 요청을 보내지 않는다 — 홈 화면을 빠르게 들락날락해도 서버에는 한 번만 감.
  if (cached?.key === key || pendingKey === key) return
  cached = null
  pendingKey = key
  fetchCallSession(payload)
    .then(async (res) => {
      if (!res.ok) return
      const data = await res.json().catch(() => null)
      if (!data?.client_secret) return
      cached = { key, clientSecret: data.client_secret }
    })
    .catch(() => {})
    .finally(() => {
      if (pendingKey === key) pendingKey = null
    })
}

// 1회용: 꺼내는 순간 캐시를 비운다. 없거나(프리페치 전) 그 사이 프로필이
// 바뀌었으면 null을 반환해 호출부가 평소처럼 새로 발급받게 한다.
export function takePrefetchedSession(payload) {
  const key = payloadKey(payload)
  if (cached?.key !== key) return null
  const session = cached
  cached = null
  return session
}
