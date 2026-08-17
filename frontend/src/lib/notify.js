// 서버 Push(lib/push.js + /api/push/send)가 기본 경로다 — 이건 그게 실패했을 때만
// (오프라인, VAPID 미설정, 구독 실패 등) 쓰는 로컬 알림 폴백이다. 페이지 JS가
// 완전히 정지된 뒤에는(특히 iOS 백그라운드) 이 호출 자체가 실행되지 않을 수 있다.
export async function showCallNotification(personaName, body) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false
  if (!('serviceWorker' in navigator)) return false

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(personaName, {
      body: body || '지금 뭐 해요?',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'was-call',
      requireInteraction: true,
      data: { url: '/?call=1' },
    })
    return true
  } catch (err) {
    console.error('로컬 알림 표시 실패', err)
    return false
  }
}
