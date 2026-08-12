import { useEffect, useState } from 'react'
import BottomNav from '../components/BottomNav'
import homeGreetingMascot from '../assets/illustrations/home-greeting-mascot.png'
import { getApp } from '../apps'
import { getPersona } from '../personas'

function formatAway(seconds) {
  const m = Math.round(seconds / 60)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분`
  return `${Math.floor(m / 60)}시간 ${m % 60}분`
}

export default function Home({
  app,
  monitoredApps,
  routines,
  awaySeconds = 0,
  onCallPress,
  onNavigate,
  onManageApps,
  onManageRoutines,
}) {
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

        <div className="mt-5 flex items-start justify-start gap-5">
          <div className="pl-3">
            <p className="text-[15px] text-[#b9b9b9]">안녕하세요,</p>
            <p className="mt-1 text-[28px] font-bold text-white">잠깐만요!</p>
            <p className="mt-3 max-w-[180px] text-[13px] leading-[1.6] text-[#b9b9b9]">
              정신없이 이어진 화면의 흐름,
              <br />
              저와 잠깐 <span className="text-accent">다른 얘기</span> 해볼까요?
            </p>
          </div>
          <div className="animate-float relative h-[130px] w-[115px] shrink-0 overflow-hidden rounded-2xl">
            <img
              src={homeGreetingMascot}
              alt="위스피 마스코트"
              className="absolute max-w-none h-[547.18%] w-[286.24%]"
              style={{ left: '-144.30%', top: '-64.43%' }}
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
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold text-white">모니터링 중인 앱</p>
            <button
              onClick={onManageApps}
              className="text-[11px] font-medium text-accent-soft active:opacity-70"
            >
              관리
            </button>
          </div>

          {monitoredApps.length === 0 ? (
            <button
              onClick={onManageApps}
              className="mt-3 flex h-[60px] w-full items-center justify-center rounded-[14px] border border-dashed border-white/20 text-[12px] font-medium text-white/40 active:opacity-70"
            >
              + 앱 추가하기
            </button>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {monitoredApps.map((m) => {
                const mApp = getApp(m.appId)
                const mPersona = getPersona(m.personaId)
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-[14px] bg-white/5 px-3 py-2.5"
                  >
                    <div className="size-9 shrink-0 overflow-hidden rounded-[8px]">
                      <img src={mApp.icon} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-white">{mApp.name}</p>
                      <p className="truncate text-[11px] text-[#919191]">
                        {mPersona.emoji} {mPersona.name} · {m.limitMinutes}분
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="my-4 h-px bg-white/10" />

          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-white">내 루틴 리스트</p>
            <button
              onClick={onManageRoutines}
              className="text-[11px] font-medium text-accent-soft active:opacity-70"
            >
              관리
            </button>
          </div>

          {routines.length === 0 ? (
            <button
              onClick={onManageRoutines}
              className="mt-3 flex h-[60px] w-full items-center justify-center rounded-[10px] border border-dashed border-white/20 text-[12px] font-medium text-white/40 active:opacity-70"
            >
              + 루틴 추가하기
            </button>
          ) : (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
              {routines.map((routine) => (
                <div
                  key={routine.id}
                  className="flex h-[60px] w-14 shrink-0 flex-col items-center justify-center gap-1.5 rounded-[10px] bg-[#574a57]"
                >
                  <span className="size-[22px] rounded-full" style={{ background: routine.color }} />
                  <span className="px-1 text-center text-[8px] font-medium text-white">{routine.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav active="home" onNavigate={onNavigate} onCallPress={onCallPress} />
    </div>
  )
}
