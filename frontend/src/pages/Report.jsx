import BottomNav from '../components/BottomNav'
import ScreenHeader from '../components/ScreenHeader'
import WeeklyBars from '../components/WeeklyBars'
import { APPS } from '../apps'

// 실제 스크린타임/통화 로그 연동 전까지의 데모용 고정 데이터.
const WEEKLY = [
  { day: '월', value: 0.35 },
  { day: '화', value: 0.5 },
  { day: '수', value: 0.3 },
  { day: '목', value: 0.9 },
  { day: '금', value: 0.45 },
  { day: '토', value: 0.2 },
  { day: '일', value: 0.15 },
]

const APP_USAGE = [
  { appId: 'youtube', percent: 48 },
  { appId: 'instagram', percent: 32 },
  { appId: 'kakaotalk', percent: 20 },
]

export default function Report({ onNavigate, onCallPress }) {
  return (
    <div className="flex h-full w-full flex-col bg-black">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-6">
        <ScreenHeader title="리포트" subtitle="이번 주, 당신의 변화를 확인해보세요" />

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { label: '개입 횟수', value: '12회' },
            { label: '평균 통화', value: '0:42' },
            { label: '되찾은 시간', value: '3시간 20분' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[16px] border border-[#695b69]/60 bg-[#1d191d] px-3 py-3 text-center"
            >
              <p className="text-[10px] leading-[1.3] text-[#919191]">{stat.label}</p>
              <p className="mt-1.5 text-[15px] font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[20px] border border-[#695b69]/60 bg-[#1d191d] p-5">
          <p className="text-[14px] font-semibold text-white">이번 주 개입 패턴</p>
          <div className="mt-4">
            <WeeklyBars data={WEEKLY} highlightIndex={3} />
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-[14px] bg-white/5 px-3.5 py-2.5">
            <span className="text-base">💜</span>
            <p className="text-[12px] text-[#c9b8e6]">잘하고 있어요! 조금씩 나아지고 있어요.</p>
          </div>
        </div>

        <div className="mt-4 rounded-[20px] border border-[#695b69]/60 bg-[#1d191d] p-5">
          <p className="text-[14px] font-semibold text-white">앱별 사용 비중</p>
          <div className="mt-4 flex flex-col gap-3.5">
            {APP_USAGE.map(({ appId, percent }) => {
              const app = APPS.find((a) => a.id === appId)
              return (
                <div key={appId}>
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="font-medium text-white">
                      {app.emoji} {app.name}
                    </span>
                    <span className="text-[#919191]">{percent}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-accent/30 bg-[#241e28] p-4">
          <span className="text-xl">💜</span>
          <p className="text-[12px] leading-[1.5] text-[#c9b8e6]">
            기록은 숫자가 아니에요. 이용 후 &lsquo;내가 원해서 멈췄다&rsquo;는 감각이 중요해요.
          </p>
        </div>
      </div>

      <BottomNav active="report" onNavigate={onNavigate} onCallPress={onCallPress} />
    </div>
  )
}
