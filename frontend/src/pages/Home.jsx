import { useEffect, useState } from 'react'
import BottomNav from '../components/BottomNav'
import homeGreetingMascot from '../assets/illustrations/ghost-image-1.png'
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
  interests = [],
  plan,
  awaySeconds = 0,
  onCallPress,
  onNavigate,
  onManageApps,
  onEditProfile,
  onDemoNotification,
  onOpenDemoExperience,
}) {
  const [showAwayNotice, setShowAwayNotice] = useState(false)

  useEffect(() => {
    if (!awaySeconds) return undefined
    setShowAwayNotice(true)
    const timer = setTimeout(() => setShowAwayNotice(false), 6000)
    return () => clearTimeout(timer)
  }, [awaySeconds])

  return (
    <div className="flex h-full w-full flex-col bg-[#1b171c]">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-6">
        <div className="flex items-center justify-between">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <button
            type="button"
            onClick={onDemoNotification}
            aria-label="알림 미리보기 (데모)"
            className="active:opacity-70"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
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
          <div className="animate-float mt-4 ml-3 flex h-[150px] w-[135px] shrink-0 items-center justify-center">
            <img src={homeGreetingMascot} alt="위스피 마스코트" className="h-auto w-full" />
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenDemoExperience}
          className="mt-6 flex w-full items-center justify-between rounded-[16px] bg-accent px-4 py-3.5 text-left active:opacity-70"
        >
          <div>
            <p className="text-[14px] font-bold text-black">진짜처럼 체험해보기</p>
            <p className="mt-0.5 text-[11px] text-black/60">인스타그램 쓰다가 전화 오는 걸 미리 볼 수 있어요</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>

        <div className="mt-4 rounded-[20px] border border-[#695b69]/60 bg-[#1d191d] p-4">
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
            <p className="text-[11px] font-semibold text-white">관심사</p>
            <button
              onClick={onEditProfile}
              className="text-[11px] font-medium text-accent-soft active:opacity-70"
            >
              수정
            </button>
          </div>

          {interests.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {interests.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent/20 px-2.5 py-1 text-[13px] font-medium text-accent-soft"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <button
              onClick={onEditProfile}
              className="mt-3 flex h-[44px] w-full items-center justify-center rounded-[10px] border border-dashed border-white/20 text-[12px] font-medium text-white/40 active:opacity-70"
            >
              + 관심사 추가하기
            </button>
          )}

          <div className="my-4 h-px bg-white/10" />

          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-white">할 일</p>
            <button
              onClick={onEditProfile}
              className="text-[11px] font-medium text-accent-soft active:opacity-70"
            >
              수정
            </button>
          </div>

          {plan ? (
            <p className="mt-3 rounded-[10px] bg-[#574a57] px-3.5 py-3 text-[13px] font-medium text-white">
              {plan}
            </p>
          ) : (
            <button
              onClick={onEditProfile}
              className="mt-3 flex h-[52px] w-full items-center justify-center rounded-[10px] border border-dashed border-white/20 text-[12px] font-medium text-white/40 active:opacity-70"
            >
              + 할 일 추가하기
            </button>
          )}
        </div>
      </div>

      <BottomNav active="home" onNavigate={onNavigate} onCallPress={onCallPress} />
    </div>
  )
}
