import { getUserId } from './storage'

// 배포 시 반드시 실제 백엔드 URL로 오버라이드해야 함 (frontend/.env.example 참고).
// 백엔드는 프론트와 별도로 배포되므로(Vercel 등) 상대 경로로는 닿지 않는다.
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const APP_SECRET = import.meta.env.VITE_APP_SHARED_SECRET || ''

export function baseHeaders() {
  const headers = { 'Content-Type': 'application/json', 'x-user-id': getUserId() }
  if (APP_SECRET) headers['x-app-secret'] = APP_SECRET
  return headers
}

// 프로필/알림 저장은 통화 흐름을 막아선 안 되는 부가 기능이라, 실패해도
// 조용히 무시한다(로컬 localStorage가 항상 안전망으로 남아있음) — 호출부가
// 매번 try/catch를 반복하지 않도록 여기서 한 번만 처리한다.
export async function postJson(path, body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: baseHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    return await res.json().catch(() => null)
  } catch {
    return null
  }
}

export async function getJson(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: baseHeaders() })
    if (!res.ok) return null
    return await res.json().catch(() => null)
  } catch {
    return null
  }
}

export function saveProfile(partial) {
  return postJson('/api/profile', partial)
}
