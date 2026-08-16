import { useState } from 'react'

function CallGateIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="#000" style={{ transform: 'rotate(-12deg)' }}>
      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z" />
    </svg>
  )
}

// 실제 드래그 제스처 대신, 탭하면 썸을 오른쪽 끝까지 CSS 전환으로 밀어 보여준 뒤
// connect()를 호출한다 — 애니메이션이 끝나기 전에 화면이 바뀌지 않도록 지연을 둔다.
const SLIDE_ANIMATION_MS = 260

export default function CallGate({ persona, onSlide }) {
  const [sliding, setSliding] = useState(false)

  const handleTap = () => {
    if (sliding) return
    setSliding(true)
    setTimeout(onSlide, SLIDE_ANIMATION_MS)
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-10 bg-[#1b171c] px-8">
      <div className="flex flex-col items-center gap-6">
        <div className="flex size-[210px] items-center justify-center rounded-full bg-white/10 text-[100px]">
          {persona?.emoji ?? '👻'}
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-[45px] font-extrabold leading-tight text-white">{persona?.name ?? '위스피'}</p>
          {persona?.tagline && <p className="text-[20px] text-[#b9b9b9]">{persona.tagline}</p>}
        </div>
      </div>

      <button
        type="button"
        onClick={handleTap}
        aria-label="밀어서 대화하기"
        className="relative h-[98px] w-full max-w-[360px] overflow-hidden rounded-full bg-[#d9d9d9]/30"
      >
        <span className="absolute inset-0 flex items-center justify-center text-[20px] text-white">
          밀어서 대화하기
        </span>
        <span
          className={`absolute top-1/2 flex size-[94px] -translate-y-1/2 items-center justify-center rounded-full bg-accent transition-[left,right] duration-300 ease-out ${
            sliding ? 'left-auto right-[2px]' : 'left-[2px]'
          }`}
        >
          <CallGateIcon />
        </span>
      </button>
    </div>
  )
}
