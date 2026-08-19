import { useEffect, useState } from 'react'
import InstaMockScreen from '../components/demo/InstaMockScreen'
import IncomingCallBanner from '../components/demo/IncomingCallBanner'

const TRIGGER_DELAY_MS = 2000

// "다른 앱을 쓰는 동안 전화가 온다"를 보여주기 위한 가짜 체험 화면 — 실제
// 이탈 감지(useAwayMonitor)와는 무관하다. 화면 진입 2초 뒤 실제 기기의 수신
// 전화 배너처럼 위에서 슬라이드되어 내려오는 배너를 띄우고, 배너를 수락하면
// 실제 이탈 감지가 쓰는 것과 똑같은 트리거(onTriggerCall)를 호출해 전화
// 수신 화면(CallSplash)으로 넘어간다.
export default function DemoExperience({ persona, onExit, onTriggerCall }) {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowBanner(true), TRIGGER_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <InstaMockScreen />

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
        className="absolute left-4 top-4 flex h-8 items-center gap-1.5 rounded-full bg-black/55 px-3 text-[12px] font-medium text-white backdrop-blur active:opacity-70"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
        체험 종료
      </button>
    </div>
  )
}
