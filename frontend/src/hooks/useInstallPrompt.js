import { useCallback, useEffect, useState } from 'react'

// 안드로이드 크롬의 네이티브 설치 프롬프트(beforeinstallprompt)를 붙잡아뒀다가
// 버튼 탭 시점에 띄운다. 이 이벤트는 브라우저가 임의 시점에 한 번만 쏘고,
// 사용자 제스처 없이 prompt()를 부르면 무시되므로 반드시 버튼 클릭 안에서 호출해야 한다.
export default function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return 'unavailable'
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return outcome // 'accepted' | 'dismissed'
  }, [deferredPrompt])

  return { canInstall: Boolean(deferredPrompt), promptInstall }
}
