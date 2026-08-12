// 잠깐만 서비스워커.
//
// 이번 스코프에서는 서버가 보내는 진짜 Web Push(구독+VAPID)는 구현하지 않는다.
// 대신 페이지 JS(useAwayMonitor)가 조건을 확인해 이 서비스워커를 통해
// "로컬 알림"(registration.showNotification)만 띄운다 — 페이지가 완전히
// 종료된 뒤에도 울리게 하려면 서버 스케줄링이 필요한데, 이번 데모 범위 밖이다.

const CALL_URL = '/?call=1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
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
