// 위스피 서비스워커.
//
// 서버(backend/src/routes/push.ts)가 web-push로 보내는 진짜 Web Push를
// 여기서 받아 OS 알림으로 띄운다. 페이지 JS(useAwayMonitor)는 임계값 도달을
// 감지해 /api/push/send를 호출하기만 하고, 실제 알림 표시는 항상 이 push
// 이벤트를 통해서 일어난다 — 탭이 완전히 닫혀 있어도 브라우저/OS가 살아있으면
// 수신된다(단, 브라우저 프로세스 자체가 종료된 경우는 플랫폼 제약으로 예외).

const CALL_URL = '/?call=1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    // 페이로드가 없거나 JSON이 아니면 기본값으로 대체
  }

  const title = payload.title || '위스피'
  const body = payload.body || '지금 뭐 해요?'

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'was-call',
      requireInteraction: true,
      data: { url: payload.url || CALL_URL },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      for (const client of allClients) {
        // 이미 열린 탭이 있으면 그 탭에 "전화 화면 열어줘" 메시지만 보내고 포커스한다.
        // client.navigate()는 일부 브라우저(특히 iOS Safari)에서 지원이 불안정해서
        // postMessage로 클라이언트 쪽이 직접 화면을 전환하게 한다.
        client.postMessage({ type: 'was:open-call' })
        if ('focus' in client) return client.focus()
      }

      return self.clients.openWindow(CALL_URL)
    })(),
  )
})
