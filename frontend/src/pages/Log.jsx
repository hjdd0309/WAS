import BottomNav from '../components/BottomNav'
import ScreenHeader from '../components/ScreenHeader'
import { getPersona } from '../personas'
import { getApp } from '../apps'
import { formatDuration } from '../hooks/useCallTimer'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function dayLabel(timestamp) {
  const d = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (isSameDay(d, today)) return '오늘'
  if (isSameDay(d, yesterday)) return '어제'
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

function timeLabel(timestamp) {
  const d = new Date(timestamp)
  const hours = d.getHours()
  const ampm = hours < 12 ? '오전' : '오후'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${ampm} ${hour12}:${minutes}`
}

function groupByDay(callLog) {
  const groups = []
  for (const entry of callLog) {
    const label = dayLabel(entry.timestamp)
    let group = groups.find((g) => g.label === label)
    if (!group) {
      group = { label, entries: [] }
      groups.push(group)
    }
    group.entries.push(entry)
  }
  return groups
}

export default function Log({ callLog, onNavigate, onCallPress }) {
  const sorted = [...callLog].sort((a, b) => b.timestamp - a.timestamp)
  const groups = groupByDay(sorted)

  const recent = sorted.filter((e) => Date.now() - e.timestamp <= WEEK_MS)
  const weekCount = recent.length
  const weekSeconds = recent.reduce((sum, e) => sum + e.durationSeconds, 0)

  return (
    <div className="flex h-full w-full flex-col bg-[#1b171c]">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-6">
        <ScreenHeader title="기록" subtitle="위스피와 나눈 대화들이에요" />

        <div className="mt-5 flex gap-2.5">
          <div className="flex-1 rounded-[16px] border border-[#695b69]/60 bg-[#1d191d] px-4 py-3">
            <p className="text-[11px] text-[#919191]">이번 주 통화</p>
            <p className="mt-1 text-[20px] font-bold text-white">{weekCount}번</p>
          </div>
          <div className="flex-1 rounded-[16px] border border-[#695b69]/60 bg-[#1d191d] px-4 py-3">
            <p className="text-[11px] text-[#919191]">이번 주 총 시간</p>
            <p className="mt-1 text-[20px] font-bold text-white">{Math.round(weekSeconds / 60)}분</p>
          </div>
        </div>

        {sorted.length === 0 ? (
          <p className="mt-10 text-center text-[13px] text-white/30">아직 통화 기록이 없어요</p>
        ) : (
          <div className="mt-6 flex flex-col gap-5">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-[13px] font-medium text-[#919191]">{group.label}</p>
                <div className="flex flex-col gap-2">
                  {group.entries.map((entry) => {
                    const persona = getPersona(entry.personaId)
                    const app = getApp(entry.appId)
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 rounded-[18px] border border-[#695b69]/60 bg-[#1d191d] p-3.5"
                      >
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl">
                          {persona.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[14px] font-semibold text-white">
                              {persona.name}
                            </p>
                            <span className="shrink-0 text-[11px] text-[#919191]">
                              {timeLabel(entry.timestamp)}
                            </span>
                          </div>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-[#919191]">
                            <img src={app.icon} alt="" className="size-3.5 shrink-0 rounded-[3px]" />
                            {app.name} · {formatDuration(entry.durationSeconds)}
                          </p>
                          {entry.quote && (
                            <p className="mt-1.5 truncate text-[12px] leading-[1.4] text-[#c9b8e6]">
                              “{entry.quote}”
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3 rounded-[18px] border border-accent/30 bg-[#241e28] p-4">
          <span className="text-xl">💜</span>
          <p className="text-[12px] leading-[1.5] text-[#c9b8e6]">
            기록은 숫자가 아니에요. 이용 후 &lsquo;내가 원해서 멈췄다&rsquo;는 감각이 중요해요.
          </p>
        </div>
      </div>

      <BottomNav active="log" onNavigate={onNavigate} onCallPress={onCallPress} />
    </div>
  )
}
