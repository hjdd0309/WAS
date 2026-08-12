import BottomNav from '../components/BottomNav'
import ScreenHeader from '../components/ScreenHeader'
import { getPersona } from '../personas'
import { getApp } from '../apps'

// 실제 통화 이력 연동 전까지의 데모용 고정 목록.
const GROUPS = [
  {
    label: '오늘',
    entries: [
      { time: '오후 3:24', personaId: 'collegeFriend', appId: 'youtube', duration: '0:38', quote: '얘기하다 보니 벌써 웃참… 그냥 웃어버렸어요' },
      { time: '오전 11:02', personaId: 'mom', appId: 'instagram', duration: '0:45', quote: '저녁은 뭐 먹었냐고 물어봐줬어요' },
    ],
  },
  {
    label: '어제',
    entries: [
      { time: '오후 9:15', personaId: 'tsundereBro', appId: 'kakaotalk', duration: '0:29', quote: '까칠하게 굴길래 저도 모르게 웃음이 났어요' },
      { time: '오후 1:47', personaId: 'trainer', appId: 'youtube', duration: '0:51', quote: '오늘 운동 언제 갈 거냐고 다그쳤어요' },
    ],
  },
]

export default function Log({ onNavigate, onCallPress }) {
  return (
    <div className="flex h-full w-full flex-col bg-black">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-6">
        <ScreenHeader title="기록" subtitle="위스피와 나눈 대화들이에요" />

        <div className="mt-5 flex gap-2.5">
          <div className="flex-1 rounded-[16px] border border-[#695b69]/60 bg-[#1d191d] px-4 py-3">
            <p className="text-[11px] text-[#919191]">이번 주 통화</p>
            <p className="mt-1 text-[20px] font-bold text-white">5번</p>
          </div>
          <div className="flex-1 rounded-[16px] border border-[#695b69]/60 bg-[#1d191d] px-4 py-3">
            <p className="text-[11px] text-[#919191]">이번 주 총 시간</p>
            <p className="mt-1 text-[20px] font-bold text-white">18분</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-[13px] font-medium text-[#919191]">{group.label}</p>
              <div className="flex flex-col gap-2">
                {group.entries.map((entry, i) => {
                  const persona = getPersona(entry.personaId)
                  const app = getApp(entry.appId)
                  return (
                    <div
                      key={i}
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
                          <span className="shrink-0 text-[11px] text-[#919191]">{entry.time}</span>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-[#919191]">
                          <img src={app.icon} alt="" className="size-3.5 shrink-0 rounded-[3px]" />
                          {app.name} · {entry.duration}
                        </p>
                        <p className="mt-1.5 truncate text-[12px] leading-[1.4] text-[#c9b8e6]">
                          “{entry.quote}”
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

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
