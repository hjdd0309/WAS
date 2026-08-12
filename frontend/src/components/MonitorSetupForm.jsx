import { APPS } from '../apps'
import PersonaLimitEditor from './PersonaLimitEditor'

// 모니터링 앱 선택 + 대화 시간 + AI 통화 상대 선택 UI. 온보딩 5단계에서 쓴다.
export default function MonitorSetupForm({
  selectedAppId,
  onSelectApp,
  limitMinutes,
  onChangeLimit,
  personaId,
  onSelectPersona,
}) {
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
              <div className="size-[45px] shrink-0 overflow-hidden rounded-[10px]">
                <img src={app.icon} alt="" className="h-full w-full object-cover" />
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

      <div className="mt-4">
        <PersonaLimitEditor
          limitMinutes={limitMinutes}
          onChangeLimit={onChangeLimit}
          personaId={personaId}
          onSelectPersona={onSelectPersona}
        />
      </div>
    </>
  )
}
