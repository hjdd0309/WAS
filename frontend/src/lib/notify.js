// 서버 Push(VAPID) 없이, 이미 등록된 서비스워커를 통해 "로컬" 알림만 띄운다.
// 페이지 JS가 완전히 정지된 뒤에는(특히 iOS 백그라운드) 이 호출 자체가 실행되지
// 않을 수 있다 — 진짜 어떤 상황에서도 울리는 알림이 필요하면 서버 Push 스케줄링이
// 별도로 필요하다 (이번 스코프 밖).
export async function showCallNotification(personaName) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false
  if (!('serviceWorker' in navigator)) return false

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(`${personaName}이(가) 전화하고 있어요 📞`, {
      body: '탭하면 바로 받을 수 있어요',
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
