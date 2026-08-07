import { useEffect } from 'react'

export default function CallBanner({ onTapBanner, onAccept, onDecline, onAutoDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onAutoDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onAutoDismiss])

  return (
    <div className="animate-banner-in absolute inset-x-3 top-3 z-30 sm:top-11">
      <div
        onClick={onTapBanner}
        className="flex items-center gap-3 rounded-[16px] bg-[#3a3a3c]/70 p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl active:opacity-90"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M12 2c.7 3.6 2.4 5.3 6 6-3.6.7-5.3 2.4-6 6-.7-3.6-2.4-5.3-6-6 3.6-.7 5.3-2.4 6-6Z" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-white">WAS AI</p>
          <p className="truncate text-[12px] text-white/60">휴대전화</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDecline()
            }}
            aria-label="거절"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff453a] active:opacity-70"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: 'rotate(135deg)' }}
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAccept()
            }}
            aria-label="받기"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#30d158] active:opacity-70"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
