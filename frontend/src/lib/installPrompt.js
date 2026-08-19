// beforeinstallprompt는 브라우저가 딱 한 번만 쏘는 이벤트라, 리스너를 늦게
// 붙이면(예: 온보딩 후반부 컴포넌트가 마운트될 때) 이미 지나간 이벤트를 영영
// 놓친다. 그래서 이 모듈은 React 마운트 타이밍과 무관하게 스크립트가 로드되는
// 즉시(정적 import 체인을 통해 앱 시작과 거의 동시에) 리스너를 등록해둔다.
let deferredPrompt = null
const listeners = new Set()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    listeners.forEach((fn) => fn(e))
  })
}

export function getDeferredPrompt() {
  return deferredPrompt
}

export function onInstallPromptAvailable(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function clearDeferredPrompt() {
  deferredPrompt = null
}
