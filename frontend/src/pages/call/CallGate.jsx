import { useRef, useState } from 'react'

function CallGateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#000" style={{ transform: 'rotate(-12deg)' }}>
      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z" />
    </svg>
  )
}

const THUMB_SIZE = 52
const INSET = 6
// 트랙 이동 가능 거리의 이 비율 이상 밀면 "완료"로 간주해 끝까지 스냅시킨다.
const COMPLETE_RATIO = 0.7
const SNAP_MS = 200

// 실제 손가락/커서를 따라 썸이 움직이는 드래그 제스처. 놓았을 때 충분히
// 밀었으면(COMPLETE_RATIO) 끝까지 스냅 애니메이션 후 connect()를 호출하고,
// 아니면 원위치로 되돌아간다.
export default function CallGate({ persona, onSlide }) {
  const trackRef = useRef(null)
  const dragRef = useRef(null) // { startClientX, startLeft, maxLeft }
  // 연속된 포인터 이벤트가 리렌더 사이 빠르게 몰아쳐 들어올 때(빠른 스와이프,
  // 자동화 도구의 합성 이벤트 등) React state 클로저가 아직 이전 값을 들고
  // 있을 수 있다. 판정에 쓰는 값은 항상 ref로 동기적으로 최신값을 읽고,
  // state(left/dragging)는 화면 표시 용도로만 쓴다.
  const leftRef = useRef(INSET)
  const draggingRef = useRef(false)
  const completedRef = useRef(false)
  const [left, setLeft] = useState(INSET)
  const [dragging, setDragging] = useState(false)

  const updateLeft = (next) => {
    leftRef.current = next
    setLeft(next)
  }

  const handlePointerDown = (e) => {
    if (completedRef.current) return
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const maxLeft = rect.width - THUMB_SIZE - INSET
    dragRef.current = { startClientX: e.clientX, startLeft: leftRef.current, maxLeft }
    draggingRef.current = true
    setDragging(true)
    track.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (!draggingRef.current || !dragRef.current) return
    const { startClientX, startLeft, maxLeft } = dragRef.current
    const next = Math.min(maxLeft, Math.max(INSET, startLeft + (e.clientX - startClientX)))
    updateLeft(next)
  }

  const finishDrag = () => {
    if (!draggingRef.current || !dragRef.current) return
    const { maxLeft } = dragRef.current
    const progress = maxLeft > INSET ? (leftRef.current - INSET) / (maxLeft - INSET) : 0
    draggingRef.current = false
    setDragging(false)
    dragRef.current = null

    if (progress >= COMPLETE_RATIO) {
      updateLeft(maxLeft)
      completedRef.current = true
      setTimeout(onSlide, SNAP_MS)
    } else {
      updateLeft(INSET)
    }
  }

  const handleKeyDown = (e) => {
    if (completedRef.current) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const track = trackRef.current
      const maxLeft = track ? track.getBoundingClientRect().width - THUMB_SIZE - INSET : leftRef.current
      updateLeft(maxLeft)
      completedRef.current = true
      setTimeout(onSlide, SNAP_MS)
    }
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

      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="밀어서 대화하기"
        className="relative h-[64px] w-full max-w-[360px] touch-none select-none overflow-hidden rounded-full bg-[#d9d9d9]/30"
      >
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[17px] text-white">
          밀어서 대화하기
        </span>
        <span
          style={{ left }}
          className={`absolute top-1/2 flex size-[52px] -translate-y-1/2 items-center justify-center rounded-full bg-accent ${
            dragging ? '' : 'transition-[left] duration-200 ease-out'
          }`}
        >
          <CallGateIcon />
        </span>
      </div>
    </div>
  )
}
