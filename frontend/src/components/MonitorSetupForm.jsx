import { PERSONAS } from '../personas'
import { APPS } from '../apps'

// 모니터링 앱 + 대화 시간 + AI 통화 상대 선택 UI. 온보딩 5단계와 설정 화면의
// 수정 모드가 이 폼을 그대로 공유한다.
export default function MonitorSetupForm({
  selectedAppId,
  onSelectApp,
  limitMinutes,
  onChangeLimit,
  personaId,
  onSelectPersona,
}) {
  const adjustLimit = (delta) => onChangeLimit(Math.min(120, Math.max(5, limitMinutes + delta)))

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {APPS.map((app) => {
          const selected = selectedAppId === app.id
          return (
            <button
              key={app.id}
              onClick={() => onSelectApp(app.id)}
              className={`flex h-[73px] items-center gap-3 rounded-[20px] border px-4 text-left transition-colors active:opacity-70 ${
                selected ? 'border-accent bg-[#a289be]' : 'border-accent/40 bg-[#241e28]'
              }`}
            >
              <div className="flex size-[45px] shrink-0 items-center justify-center rounded-[10px] bg-white text-xl">
                {app.emoji}
              </div>
              <span className="flex-1 text-[18px] font-semibold text-white">{app.name}</span>
              {selected && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-col gap-5 rounded-[20px] border border-accent/40 bg-[#241e28] p-5">
        <div>
          <p className="mb-3 text-[15px] font-semibold text-white">대화 시간을 설정해요.</p>
          <div className="flex items-center justify-between">
            <button
              onClick={() => adjustLimit(-5)}
              aria-label="5분 줄이기"
              className="flex size-11 items-center justify-center rounded-full border border-accent/40 text-xl font-semibold text-white active:opacity-70"
            >
              −
            </button>
            <span className="text-[18px] font-semibold text-white">{limitMinutes}분</span>
            <button
              onClick={() => adjustLimit(5)}
              aria-label="5분 늘리기"
              className="flex size-11 items-center justify-center rounded-full border border-accent/40 text-xl font-semibold text-white active:opacity-70"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <p className="mb-3 text-[15px] font-semibold text-white">어떻게 불러드릴까요?</p>
          <div className="grid grid-cols-2 gap-2">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectPersona(p.id)}
                className={`flex h-[33px] items-center justify-center rounded-[20px] border text-[12px] font-medium transition-colors active:opacity-70 ${
                  personaId === p.id
                    ? 'border-accent bg-accent text-black'
                    : 'border-accent/40 bg-[#241e28] text-white'
                }`}
              >
                {p.emoji} {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
