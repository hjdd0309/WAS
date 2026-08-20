import { useEffect, useState } from 'react'

function PhoneIcon({ rotate, color = '#fff' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color} style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z" />
    </svg>
  )
}

// 배너가 위로 슬라이드되어 사라지는 퇴장 애니메이션 시간 — 진입(duration-300)과
// 대칭을 맞춘다. 이 시간이 지난 뒤에야 실제로 부모에게 닫힘을 알려 DOM에서
// 제거한다 — 그냥 바로 사라지면(거절 버튼 클릭 즉시 언마운트) 사용자가 액션이
// 실제로 반영됐는지 인지할 틈이 없어 배너가 "그냥 사라진 것"처럼 혼란스럽다.
const EXIT_DURATION_MS = 300

// 다른 앱을 쓰는 도중 실제 아이폰/안드로이드가 보여주는 것처럼, 화면 위에서
// 아래로 슬라이드되어 내려오는 가로형 수신 전화 배너. 탭하거나 수락을 누르면
// 실제 통화 화면(onAccept → CallSplash)으로, 거절을 누르면 진입할 때와 대칭으로
// 다시 위로 슬라이드되어 사라진 뒤 지금 보던 화면으로 되돌아간다.
export default function IncomingCallBanner({ persona, onAccept, onDecline }) {
  const [entered, setEntered] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleDecline = () => {
    if (leaving) return
    setLeaving(true)
    setTimeout(onDecline, EXIT_DURATION_MS)
  }

  return (
    <div
      className={`absolute inset-x-0 top-0 z-[60] px-2 pt-2 transition-transform duration-300 ease-out ${
        entered && !leaving ? 'translate-y-0' : '-translate-y-[130%]'
      }`}
    >
      <button
        type="button"
        onClick={onAccept}
        disabled={leaving}
        className="flex w-full items-center gap-3 rounded-[20px] bg-[#211d22]/95 px-3 py-2.5 text-left shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur active:opacity-90"
      >
        <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-[22px]">
          {persona?.image ? (
            <img src={persona.image} alt="" className="size-9 object-contain" />
          ) : (
            persona?.emoji ?? '👻'
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-white">{persona?.name ?? '위스피'}</p>
          <p className="text-[11px] text-[#b9b9b9]">전화 왔어요</p>
        </div>
        <span
          role="button"
          tabIndex={0}
          aria-label="거절"
          onClick={(e) => {
            e.stopPropagation()
            handleDecline()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              handleDecline()
            }
          }}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ff4b4b] active:opacity-70"
        >
          <PhoneIcon rotate={135} />
        </span>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent">
          <PhoneIcon rotate={-12} color="#000" />
        </span>
      </button>
    </div>
  )
}
