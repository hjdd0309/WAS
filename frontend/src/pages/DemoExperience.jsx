import { useEffect, useState } from 'react'
import InstaMockScreen from '../components/demo/InstaMockScreen'
import IncomingCallBanner from '../components/demo/IncomingCallBanner'
import NotificationBanner from '../components/demo/NotificationBanner'
import { fetchNotificationPreviewText } from '../lib/push'

const NOTIFICATION_DELAY_MS = 5000
const TRIGGER_DELAY_MS = 10000
const DEFAULT_NOTIFICATION_TEXT = '지금 뭐 하고 있어요? 잠깐 얘기해요'

// "다른 앱을 쓰는 동안 전화가 온다"를 보여주기 위한 가짜 체험 화면 — 실제
// 이탈 감지(useAwayMonitor)와는 무관하다. 화면 진입 후 곧바로 배너가 뜨지 않고
// 피드를 좀 둘러볼 몰입 시간을 준 뒤, 실제 서비스가 보내는 것과 같은 문구
// 알림(NOTIFICATION_DELAY_MS)이 먼저 뜨고, 조금 더 지나야(TRIGGER_DELAY_MS)
// 실제 기기의 수신 전화 배너처럼 위에서 슬라이드되어 내려오는 배너를 띄운다.
// 배너를 수락하면 실제 이탈 감지가 쓰는 것과 똑같은 트리거(onTriggerCall)를
// 호출해 전화 수신 화면(CallSplash)으로 넘어간다.
export default function DemoExperience({ persona, onExit, onTriggerCall }) {
  const [showNotification, setShowNotification] = useState(false)
  const [notificationText, setNotificationText] = useState(DEFAULT_NOTIFICATION_TEXT)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchNotificationPreviewText().then((text) => {
      if (!cancelled && text) setNotificationText(text)
    })

    const notificationTimer = setTimeout(() => setShowNotification(true), NOTIFICATION_DELAY_MS)
    const callTimer = setTimeout(() => setShowBanner(true), TRIGGER_DELAY_MS)
    return () => {
      cancelled = true
      clearTimeout(notificationTimer)
      clearTimeout(callTimer)
    }
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <InstaMockScreen />

      {showNotification && !showBanner && <NotificationBanner text={notificationText} />}

      {showBanner && (
        <IncomingCallBanner
          persona={persona}
          onAccept={onTriggerCall}
          onDecline={() => setShowBanner(false)}
        />
      )}

      <button
        type="button"
        onClick={onExit}
        aria-label="체험 종료"
        className="absolute right-4 top-4 z-[70] flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-3.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(0,0,0,0.5)] backdrop-blur active:opacity-70"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
        체험 종료
      </button>
    </div>
  )
}
