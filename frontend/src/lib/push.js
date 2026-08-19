import { postJson, getJson } from './api'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

// 알림 권한이 허용된 뒤 호출 — 서비스워커의 PushManager로 실제 서버 Push 구독을
// 만들고 백엔드에 등록한다. VAPID 공개키가 없거나(미배포/미설정) 브라우저가
// PushManager를 지원하지 않으면 조용히 false만 반환한다 — 호출부(useAwayMonitor)가
// 로컬 알림으로 폴백하므로 기능 자체가 끊기지는 않는다.
export async function subscribeToPush() {
  if (!VAPID_PUBLIC_KEY) return false
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  try {
    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }
    const result = await postJson('/api/push/subscribe', subscription.toJSON())
    return Boolean(result?.ok)
  } catch (err) {
    console.error('푸시 구독 실패', err)
    return false
  }
}

// 알림 문구를 매번 nano 모델로 새로 생성해서 받아온다(고정 문구 반복 방지).
// 실패하면 null — 호출부는 notify.js의 기본 문구로 폴백한다.
export async function fetchNotificationPreviewText() {
  const result = await getJson('/api/push/preview-text')
  return result?.text || null
}
