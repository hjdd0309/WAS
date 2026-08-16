import { useState } from 'react'

export default function RoutineManage({ routines, onAdd, onRemove, onBack }) {
  const [draft, setDraft] = useState('')

  const submit = () => {
    const label = draft.trim().slice(0, 20)
    if (!label) return
    onAdd(label)
    setDraft('')
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#1b171c]">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="뒤로"
            className="flex size-9 items-center justify-center rounded-full bg-white/10 active:opacity-70"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-[20px] font-bold text-white">루틴 관리</h1>
        </div>
        <p className="mt-2 pl-[3px] text-[13px] text-[#919191]">
          홈 화면에 보여줄 나만의 루틴을 관리해요
        </p>

        <div className="mt-6 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 20))}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="예: 영어 공부"
            className="flex-1 rounded-[14px] border border-accent/40 bg-[#241e28] px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/30"
          />
          <button
            onClick={submit}
            disabled={!draft.trim()}
            className="rounded-[14px] bg-accent px-5 text-[14px] font-semibold text-black active:opacity-70 disabled:opacity-40"
          >
            추가
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {routines.length === 0 ? (
            <p className="mt-6 text-center text-[13px] text-white/30">아직 등록한 루틴이 없어요</p>
          ) : (
            routines.map((routine) => (
              <div
                key={routine.id}
                className="flex items-center gap-3 rounded-[16px] border border-[#695b69]/60 bg-[#1d191d] p-3.5"
              >
                <span className="size-[22px] shrink-0 rounded-full" style={{ background: routine.color }} />
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-white">
                  {routine.label}
                </span>
                <button
                  onClick={() => onRemove(routine.id)}
                  aria-label={`${routine.label} 삭제`}
                  className="shrink-0 text-[12px] font-medium text-[#ff453a] active:opacity-70"
                >
                  삭제
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
