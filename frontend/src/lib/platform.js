// iOS는 beforeinstallprompt 자체가 없고 Web Push도 홈 화면 추가(standalone) 상태에서만
// 동작하기 때문에, 플랫폼과 설치 상태를 구분해서 안내 문구를 갈라 보여줘야 한다.

export function isIOS() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const isAppleMobileUA = /iPad|iPhone|iPod/.test(ua)
  // iPadOS 13+는 UA가 Mac으로 뜨지만 터치포인트로 구분 가능
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return isAppleMobileUA || isIPadOS
}

export function isAndroid() {
  if (typeof navigator === 'undefined') return false
  return /Android/.test(navigator.userAgent || '')
}

export function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    // iOS Safari 전용 레거시 플래그
    window.navigator.standalone === true
  )
}
