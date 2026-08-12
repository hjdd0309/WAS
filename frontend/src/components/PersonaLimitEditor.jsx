import { PERSONAS } from '../personas'

// 대화 시간 + AI 통화 상대(페르소나) 선택 UI. 온보딩 5단계와 앱별 관리
// 화면(AppManage)이 이 조각을 공유한다.
export default function PersonaLimitEditor({ limitMinutes, onChangeLimit, personaId, onSelectPersona }) {
  const adjustLimit = (delta) => onChangeLimit(Math.min(120, Math.max(5, limitMinutes + delta)))

  return (
    <div className="flex flex-col gap-5 rounded-[20px] border border-accent/40 bg-[#241e28] p-5">
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
  )
}
