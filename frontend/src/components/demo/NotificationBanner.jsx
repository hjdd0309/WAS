import { useEffect, useState } from 'react'

// 실제 서비스가 보내는 푸시 알림과 똑같은 문구(fetchNotificationPreviewText)를
// 미리보기로 띄우는 배너 — 전화가 오기 전 "메시지 하나 왔다"는 걸 먼저 보여줘
// 실제 알림 흐름처럼 느껴지게 한다. IncomingCallBanner와 달리 탭 인터랙션은
// 없고, 부모(DemoExperience)가 정해준 시간 동안만 보였다 자동으로 사라진다.
export default function NotificationBanner({ text }) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-[55] px-2 pt-2 transition-transform duration-300 ease-out ${
        entered ? 'translate-y-0' : '-translate-y-[130%]'
      }`}
    >
      <div className="flex w-full items-start gap-2.5 rounded-[18px] bg-[#211d22]/95 px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur">
        <img src="/icons/icon-192.png" alt="" className="size-9 shrink-0 rounded-[9px] object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[13px] font-semibold text-white">위스피</p>
            <span className="shrink-0 text-[11px] text-[#8e8e8e]">지금</span>
          </div>
          <p className="line-clamp-2 text-[13px] leading-snug text-[#e5e5e5]">{text}</p>
        </div>
      </div>
    </div>
  )
}
