import { useEffect, useState } from 'react'

function PhoneIcon({ rotate, color = '#fff' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color} style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z" />
    </svg>
  )
}

// 다른 앱을 쓰는 도중 실제 아이폰/안드로이드가 보여주는 것처럼, 화면 위에서
// 아래로 슬라이드되어 내려오는 가로형 수신 전화 배너. 탭하거나 수락을 누르면
// 실제 통화 화면(onAccept → CallSplash)으로, 거절을 누르면 진입할 때와 대칭으로
// 다시 위로 슬라이드되어 사라진다. 퇴장 타이밍(몇 ms 뒤에 실제로 언마운트할지)은
// 부모(DemoExperience)가 `leaving` prop으로 제어한다 — 체험 종료 버튼이 배너와
// 같은 순간에 함께 움직이려면 두 컴포넌트가 같은 상태를 봐야 하기 때문.
export default function IncomingCallBanner({ persona, onAccept, onDeclineClick, leaving }) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(raf)
  }, [])

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
            onDeclineClick()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              onDeclineClick()
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
