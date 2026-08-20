import { useEffect, useState } from 'react'
import InstaMockScreen from '../components/demo/InstaMockScreen'
import IncomingCallBanner from '../components/demo/IncomingCallBanner'
import NotificationBanner from '../components/demo/NotificationBanner'
import { fetchNotificationPreviewText } from '../lib/push'

const NOTIFICATION_DELAY_MS = 5000
const TRIGGER_DELAY_MS = 10000
const DEFAULT_NOTIFICATION_TEXT = '지금 뭐 하고 있어요? 잠깐 얘기해요'
// IncomingCallBanner의 진입/퇴장 슬라이드 애니메이션(duration-300)과 맞춘 시간.
// 거절 클릭 즉시 언마운트하지 않고 이만큼 기다렸다가 실제로 없애야 배너가
// 위로 슬라이드되어 사라지는 모습을 볼 수 있다.
const CALL_BANNER_EXIT_MS = 300
// 체험 종료 버튼을 배너 아래로 밀어낼 이동 거리 — top-4(16px) 기준 배너 높이만큼
// 아래(top-20, 80px)로 내려가도록 64px(=translate-y-16) 이동.
const EXIT_BUTTON_PUSH_CLASS = 'translate-y-16'

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
  const [callBannerMounted, setCallBannerMounted] = useState(false)
  // 거절 클릭 순간 즉시 true — IncomingCallBanner의 퇴장 슬라이드와 체험 종료
  // 버튼의 원위치 복귀가 같은 프레임에서 같이 시작되도록, 두 컴포넌트가 이
  // 하나의 상태를 그대로 같이 본다.
  const [callBannerLeaving, setCallBannerLeaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchNotificationPreviewText().then((text) => {
      if (!cancelled && text) setNotificationText(text)
    })

    const notificationTimer = setTimeout(() => setShowNotification(true), NOTIFICATION_DELAY_MS)
    const callTimer = setTimeout(() => setCallBannerMounted(true), TRIGGER_DELAY_MS)
    return () => {
      cancelled = true
      clearTimeout(notificationTimer)
      clearTimeout(callTimer)
    }
  }, [])

  // 거절한 뒤 모의 피드에 그대로 두면, 이미 한 번 보여준 문구 알림 배너가
  // (showNotification은 계속 true라) 수신 전화 배너가 사라지는 순간 다시
  // 나타나 버린다 — 더 보여줄 것도 없이 똑같은 배너가 반복되는 셈이라
  // 혼란스럽다. 그래서 거절 애니메이션이 끝나면 체험 전체를 끝내고 홈으로.
  const handleDeclineCall = () => {
    if (callBannerLeaving) return
    setCallBannerLeaving(true)
    setTimeout(onExit, CALL_BANNER_EXIT_MS)
  }

  // 배너(문구 알림이든 수신 전화든)가 화면에 실제로 걸쳐 있는 동안만 체험
  // 종료 버튼을 아래로 밀어낸다 — 수신 전화 배너가 퇴장 애니메이션을 타기
  // 시작하는 순간(callBannerLeaving) 버튼도 같이 원위치로 올라간다.
  const bannerOnScreen =
    (showNotification && !callBannerMounted) || (callBannerMounted && !callBannerLeaving)

  return (
    <div className="relative h-full w-full overflow-hidden">
      <InstaMockScreen />

      {showNotification && !callBannerMounted && <NotificationBanner text={notificationText} />}

      {callBannerMounted && (
        <IncomingCallBanner
          persona={persona}
          onAccept={onTriggerCall}
          onDeclineClick={handleDeclineCall}
          leaving={callBannerLeaving}
        />
      )}

      <button
        type="button"
        onClick={onExit}
        aria-label="체험 종료"
        className={`absolute right-4 top-4 z-[70] flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-3.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(0,0,0,0.5)] backdrop-blur transition-transform duration-300 ease-out active:opacity-70 ${
          bannerOnScreen ? EXIT_BUTTON_PUSH_CLASS : 'translate-y-0'
        }`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
        체험 종료
      </button>
    </div>
  )
}
