import { useEffect } from 'react'
import mainLogo from '../assets/illustrations/main-logo.png'

export default function CallSplash({ onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 2200)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      onClick={onDismiss}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onDismiss()}
      className="flex h-full w-full flex-col items-center"
      style={{
        backgroundImage:
          'linear-gradient(160deg, #b190ea 0%, #645184 45%, #000 100%)',
      }}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <img
          src={mainLogo}
          alt="위스피"
          className="h-[130px] w-[127px] rounded-[34px] border border-[#444] object-cover shadow-[0_4px_20px_rgba(177,144,234,0.5)]"
        />
        <p className="text-[23px] font-extrabold text-white">잠깐만</p>
      </div>

      <div className="pb-8" />
    </div>
  )
}
