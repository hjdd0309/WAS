import BottomNav from '../components/BottomNav'
import ScreenHeader from '../components/ScreenHeader'
import WeeklyBars from '../components/WeeklyBars'
import { APPS } from '../apps'
import { formatDuration } from '../hooks/useCallTimer'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

// JS의 Date#getDay()는 일요일이 0이라, 월요일을 0으로 보는 인덱스로 바꿔준다.
function mondayIndex(date) {
  return (date.getDay() + 6) % 7
}

function computeWeeklyBars(recentCalls) {
  const counts = Array(7).fill(0)
  for (const entry of recentCalls) {
    counts[mondayIndex(new Date(entry.timestamp))] += 1
  }
  const max = Math.max(...counts, 1)
  return WEEKDAY_LABELS.map((day, i) => ({ day, value: counts[i] / max }))
}

function computeAppUsage(recentCalls) {
  const counts = {}
  for (const entry of recentCalls) {
    counts[entry.appId] = (counts[entry.appId] ?? 0) + 1
  }
  const total = recentCalls.length
  if (total === 0) return []
  return Object.entries(counts)
    .map(([appId, count]) => ({ appId, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.percent - a.percent)
}

export default function Report({ callLog, onNavigate, onCallPress }) {
  const recentCalls = callLog.filter((e) => Date.now() - e.timestamp <= WEEK_MS)
  const weekCount = recentCalls.length
  const avgSeconds = weekCount === 0 ? 0 : Math.round(recentCalls.reduce((s, e) => s + e.durationSeconds, 0) / weekCount)
  const totalMinutes = Math.round(recentCalls.reduce((s, e) => s + e.durationSeconds, 0) / 60)
  const weeklyBars = computeWeeklyBars(recentCalls)
  const appUsage = computeAppUsage(recentCalls)

  return (
    <div className="flex h-full w-full flex-col bg-[#1b171c]">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-6">
        <ScreenHeader title="리포트" subtitle="이번 주, 당신의 변화를 확인해보세요" />

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { label: '개입 횟수', value: `${weekCount}회` },
            { label: '평균 통화', value: formatDuration(avgSeconds) },
            { label: '총 대화 시간', value: `${totalMinutes}분` },
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
            <WeeklyBars data={weeklyBars} highlightIndex={mondayIndex(new Date())} />
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-[14px] bg-white/5 px-3.5 py-2.5">
            <span className="text-base">💜</span>
            <p className="text-[12px] text-[#c9b8e6]">
              {weekCount === 0 ? '이번 주는 아직 통화가 없어요.' : '잘하고 있어요! 조금씩 나아지고 있어요.'}
            </p>
          </div>
        </div>

        {appUsage.length > 0 && (
          <div className="mt-4 rounded-[20px] border border-[#695b69]/60 bg-[#1d191d] p-5">
            <p className="text-[14px] font-semibold text-white">앱별 개입 비중</p>
            <div className="mt-4 flex flex-col gap-3.5">
              {appUsage.map(({ appId, percent }) => {
                const app = APPS.find((a) => a.id === appId)
                if (!app) return null
                return (
                  <div key={appId}>
                    <div className="mb-1.5 flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-1.5 font-medium text-white">
                        <img src={app.icon} alt="" className="size-3.5 shrink-0 rounded-[3px]" />
                        {app.name}
                      </span>
                      <span className="text-[#919191]">{percent}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

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
