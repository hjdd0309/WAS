import { useEffect, useState } from 'react'
import BottomNav from '../components/BottomNav'
import BellIcon from '../components/BellIcon'
import homeGreetingMascot from '../assets/illustrations/home-greeting-mascot.png'

function formatAway(seconds) {
  const m = Math.round(seconds / 60)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분`
  return `${Math.floor(m / 60)}시간 ${m % 60}분`
}

// 실제 루틴 기능이 붙기 전까지의 데모용 고정 목록.
const ROUTINES = [
  { label: '공모전 준비', color: '#ff9090' },
  { label: '책읽기', color: '#511010' },
  { label: '헬스장 가기', color: '#282c47' },
  { label: '요리 연습', color: '#cbe291' },
  { label: '수영', color: '#586deb' },
]

function formatLimitLabel(minutes) {
  if (minutes % 60 === 0) return `${minutes / 60}시간`
  if (minutes < 60) return `${minutes}분`
  return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`
}

export default function Home({ app, persona, limitMinutes, awaySeconds = 0, onCallPress, onNavigate }) {
  const [showAwayNotice, setShowAwayNotice] = useState(false)

  useEffect(() => {
    if (!awaySeconds) return undefined
    setShowAwayNotice(true)
    const timer = setTimeout(() => setShowAwayNotice(false), 6000)
    return () => clearTimeout(timer)
  }, [awaySeconds])

  return (
    <div className="flex h-full w-full flex-col bg-black">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-6">
        <div className="flex items-center justify-between">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>

        {showAwayNotice && (
          <div className="animate-fade-in mt-4 rounded-[14px] bg-white/5 px-3.5 py-2.5 text-[12px] text-white/50">
            {formatAway(awaySeconds)} 동안 자리를 비우셨네요
          </div>
        )}

        <div className="mt-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] text-[#b9b9b9]">안녕하세요,</p>
            <p className="mt-1 text-[28px] font-bold text-white">잠깐만요!</p>
            <p className="mt-3 max-w-[180px] text-[13px] leading-[1.6] text-[#b9b9b9]">
              정신없이 이어진 화면의 흐름,
              <br />
              저와 잠깐 <span className="text-accent">다른 얘기</span> 해볼까요?
            </p>
          </div>
          <div className="relative h-[106px] w-[130px] shrink-0 overflow-hidden rounded-2xl">
            <img
              src={homeGreetingMascot}
              alt="위스피 마스코트"
              className="absolute max-w-none h-[645.25%] w-[243.44%]"
              style={{ left: '-131.95%', top: '-85.47%' }}
            />
          </div>
        </div>

        <div className="mt-6 rounded-[20px] border border-[#695b69]/60 bg-[#1d191d] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-white">지금 집중하고 있던 것</p>
            <span className="text-[11px] font-medium text-accent-soft">지금</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="size-[45px] shrink-0 overflow-hidden rounded-[10px]">
              <img src={app.icon} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-white">{app.name}</p>
              <p className="text-[12px] text-[#afafaf]">보고 계신 지 45분</p>
            </div>
            <button
              aria-label="바로가기"
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#635281] bg-black active:opacity-70"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-[20px] border border-[#695b69]/60 bg-[#1d191d] p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-accent">
              <BellIcon size={16} />
            </span>
            <p className="text-[12px] font-medium text-white">{persona.name}이 먼저 전화할게요</p>
          </div>

          <h2 className="mt-4 text-[19px] font-semibold leading-[1.4] text-white">
            {formatLimitLabel(limitMinutes)}이 넘는다면,
            <br />
            제가 당신을 <span className="text-accent-soft">불러줄게요</span>
          </h2>
          <p className="mt-2 max-w-[210px] text-[12px] leading-[1.6] text-[#b9b9b9]">
            당신이 너무 오래 머물고 있을 때
            <br />
            제가 슬쩍 찾아가 말을 건넬게요
          </p>

          <div className="my-4 h-px bg-white/10" />

          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-white">내 루틴 리스트</p>
            <button className="text-[11px] font-medium text-accent-soft active:opacity-70">관리</button>
          </div>

          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {ROUTINES.map((routine) => (
              <div
                key={routine.label}
                className="flex h-[60px] w-14 shrink-0 flex-col items-center justify-center gap-1.5 rounded-[10px] bg-[#574a57]"
              >
                <span className="size-[22px] rounded-full" style={{ background: routine.color }} />
                <span className="px-1 text-center text-[8px] font-medium text-white">{routine.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav active="home" onNavigate={onNavigate} onCallPress={onCallPress} />
    </div>
  )
}
