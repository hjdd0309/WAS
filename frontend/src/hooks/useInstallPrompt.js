import { useCallback, useEffect, useState } from 'react'
import { getDeferredPrompt, onInstallPromptAvailable, clearDeferredPrompt } from '../lib/installPrompt'

// 안드로이드 크롬의 네이티브 설치 프롬프트(beforeinstallprompt)를 붙잡아뒀다가
// 버튼 탭 시점에 띄운다. 실제 이벤트 캡처는 lib/installPrompt.js가 모듈 로드
// 즉시(이 컴포넌트가 마운트되기 훨씬 전부터) 해두므로, 여기서는 그 결과를
// 구독만 한다. 사용자 제스처 없이 prompt()를 부르면 무시되므로 반드시 버튼
// 클릭 안에서 호출해야 한다.
export default function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(getDeferredPrompt)

  useEffect(() => onInstallPromptAvailable(setDeferredPrompt), [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return 'unavailable'
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    clearDeferredPrompt()
    setDeferredPrompt(null)
    return outcome // 'accepted' | 'dismissed'
  }, [deferredPrompt])

  return { canInstall: Boolean(deferredPrompt), promptInstall }
}
