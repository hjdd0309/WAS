import { useState } from 'react'
import { APPS, getApp } from '../apps'
import { getPersona } from '../personas'
import PersonaLimitEditor from '../components/PersonaLimitEditor'

export default function AppManage({ monitoredApps, onAddApp, onUpdateApp, onRemoveApp, onBack }) {
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(null)
  const addableApps = APPS.filter((a) => !monitoredApps.some((m) => m.appId === a.id))

  const startEdit = (m) => {
    setDraft({ limitMinutes: m.limitMinutes, personaId: m.personaId })
    setEditingId(m.id)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft(null)
  }

  const saveEdit = (id) => {
    onUpdateApp(id, draft)
    setEditingId(null)
    setDraft(null)
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
          <h1 className="text-[20px] font-bold text-white">모니터링 앱 관리</h1>
        </div>
        <p className="mt-2 pl-[3px] text-[13px] text-[#919191]">
          앱마다 다른 목소리와 시간을 따로 설정할 수 있어요
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          {monitoredApps.length === 0 && (
            <p className="mt-4 text-center text-[13px] text-white/30">아직 모니터링 중인 앱이 없어요</p>
          )}

          {monitoredApps.map((m) => {
            const app = getApp(m.appId)
            const persona = getPersona(m.personaId)
            const editing = editingId === m.id

            return (
              <div
                key={m.id}
                className="rounded-[18px] border border-[#695b69]/60 bg-[#1d191d] p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-11 shrink-0 overflow-hidden rounded-[10px]">
                    <img src={app.icon} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-white">{app.name}</p>
                    <p className="truncate text-[12px] text-[#919191]">
                      {persona.emoji} {persona.name} · {m.limitMinutes}분
                    </p>
                  </div>
                  {!editing && (
                    <button
                      onClick={() => startEdit(m)}
                      className="shrink-0 text-[12px] font-medium text-accent-soft active:opacity-70"
                    >
                      수정
                    </button>
                  )}
                </div>

                {editing && (
                  <div className="mt-4">
                    <PersonaLimitEditor
                      limitMinutes={draft.limitMinutes}
                      onChangeLimit={(limitMinutes) => setDraft((d) => ({ ...d, limitMinutes }))}
                      personaId={draft.personaId}
                      onSelectPersona={(personaId) => setDraft((d) => ({ ...d, personaId }))}
                    />

                    <button
                      onClick={() => onRemoveApp(m.id)}
                      className="mt-3 text-[12px] font-medium text-[#ff453a] active:opacity-70"
                    >
                      이 앱 그만 모니터링하기
                    </button>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={cancelEdit}
                        className="h-11 flex-1 rounded-[14px] bg-white/10 text-[13px] font-semibold text-white active:opacity-70"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => saveEdit(m.id)}
                        className="h-11 flex-1 rounded-[14px] bg-accent text-[13px] font-semibold text-black active:opacity-70"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {addableApps.length > 0 && (
          <div className="mt-6">
            <p className="mb-2.5 text-[13px] font-medium text-[#919191]">+ 앱 추가</p>
            <div className="flex flex-col gap-2.5">
              {addableApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => onAddApp(app.id)}
                  className="flex items-center gap-3 rounded-[18px] border border-dashed border-white/20 p-4 text-left active:opacity-70"
                >
                  <div className="size-11 shrink-0 overflow-hidden rounded-[10px]">
                    <img src={app.icon} alt="" className="h-full w-full object-cover" />
                  </div>
                  <span className="flex-1 text-[14px] font-semibold text-white">{app.name}</span>
                  <span className="text-[13px] text-accent-soft">추가</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
