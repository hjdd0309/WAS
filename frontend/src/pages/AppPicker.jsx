import { useState } from 'react'
import Button from '../components/Button'
import StatusBar from '../components/StatusBar'
import TagInput from '../components/TagInput'
import { formatDuration } from '../hooks/useCallTimer'
import { PERSONAS } from '../personas'

const dummyApps = [
  {
    id: 'instagram',
    name: '인스타그램',
    emoji: '📷',
    bg: 'linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)',
  },
  { id: 'youtube', name: '유튜브', emoji: '▶', bg: '#ff0000' },
  { id: 'shorts', name: '유튜브 쇼츠', emoji: '⚡', bg: '#ff0033' },
  { id: 'tiktok', name: '틱톡', emoji: '🎵', bg: '#000000' },
  { id: 'x', name: 'X (트위터)', emoji: '𝕏', bg: '#000000' },
  { id: 'threads', name: '스레드', emoji: '@', bg: '#1c1c1e' },
]

export default function AppPicker({
  apps = [],
  editingApp,
  monitorSeconds = 0,
  onConfirm,
  onDelete,
  onBack,
}) {
  const [selected, setSelected] = useState(editingApp ?? null)
  const [limitMinutes, setLimitMinutes] = useState(editingApp?.limitMinutes ?? 20)
  const [personaId, setPersonaId] = useState(editingApp?.personaId ?? 'bestie')
  const [interests, setInterests] = useState(editingApp?.interests ?? [])
  const [plan, setPlan] = useState(editingApp?.plan ?? '')

  const adjustLimit = (delta) =>
    setLimitMinutes((m) => Math.min(60, Math.max(5, m + delta)))

  const selectableApps = dummyApps.filter(
    (candidate) => !apps.some((added) => added.id === candidate.id),
  )

  const progress = editingApp
    ? Math.min(monitorSeconds / (editingApp.limitMinutes * 60), 1)
    : 0

  return (
    <div className="flex h-full w-full flex-col bg-white px-6 pb-8 pt-3">
      <StatusBar dark />

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 active:opacity-70"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#191f28"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-[20px] font-bold text-gray-900">
          {editingApp ? '앱 편집' : '앱 추가'}
        </h1>
      </div>

      <div className="no-scrollbar mt-6 flex-1 overflow-y-auto">
        {editingApp ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-gray-50 p-5">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-[16px] text-2xl"
              style={{ background: editingApp.bg }}
            >
              {editingApp.emoji}
            </div>
            <p className="font-semibold text-gray-900">
              {editingApp.name} 사용 중
            </p>
            <p className="text-sm text-gray-400">
              {formatDuration(monitorSeconds)} / {editingApp.limitMinutes}:00
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        ) : selectableApps.length === 0 ? (
          <p className="mt-10 text-center text-sm text-gray-400">
            추가할 수 있는 앱이 없어요
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {selectableApps.map((app) => {
              const isSelected = selected?.id === app.id
              return (
                <button
                  key={app.id}
                  onClick={() => setSelected(app)}
                  className={`flex items-center gap-3 rounded-2xl p-3 text-left transition-colors active:opacity-70 ${
                    isSelected ? 'bg-accent-light' : ''
                  }`}
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-xl"
                    style={{ background: app.bg }}
                  >
                    {app.emoji}
                  </div>
                  <span className="flex-1 font-semibold text-gray-900">
                    {app.name}
                  </span>
                  {isSelected && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3182f6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {selected && (
          <div className="animate-fade-in mt-4 flex flex-col gap-5 rounded-2xl bg-gray-50 p-4">
            <div>
              <p className="mb-2 text-[13px] font-medium text-gray-400">시간 제한</p>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => adjustLimit(-5)}
                  aria-label="5분 줄이기"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-semibold text-gray-700 active:opacity-70"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-gray-900">
                  {limitMinutes}분
                </span>
                <button
                  onClick={() => adjustLimit(5)}
                  aria-label="5분 늘리기"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-semibold text-gray-700 active:opacity-70"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <p className="text-[13px] font-medium text-gray-400">AI 통화 설정</p>
                <p className="text-[11px] text-gray-300">이 앱에서만 적용돼요</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPersonaId(p.id)}
                    className={`flex flex-col items-center gap-0.5 rounded-xl py-2.5 text-sm font-semibold transition-colors active:opacity-70 ${
                      personaId === p.id
                        ? 'bg-accent text-white'
                        : 'bg-white text-gray-500'
                    }`}
                  >
                    <span>
                      {p.emoji} {p.name}
                    </span>
                    <span
                      className={`text-[11px] font-normal ${
                        personaId === p.id ? 'text-white/70' : 'text-gray-400'
                      }`}
                    >
                      {p.tagline}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[13px] font-medium text-gray-400">
                관심사 <span className="text-gray-300">(선택)</span>
              </p>
              <TagInput
                value={interests}
                onChange={setInterests}
                placeholder="예: 축구, 카페, K-pop"
              />
            </div>

            <div>
              <p className="mb-2 text-[13px] font-medium text-gray-400">
                요즘 하려는 일 <span className="text-gray-300">(선택)</span>
              </p>
              <input
                value={plan}
                onChange={(e) => setPlan(e.target.value.slice(0, 200))}
                placeholder="예: 자격증 공부, 운동 루틴 만들기"
                className="w-full rounded-xl bg-white p-3 text-[16px] text-gray-900 outline-none placeholder:text-gray-300"
              />
              <p className="mt-1 text-[11px] leading-relaxed text-gray-300">
                전화 마무리에 "저번에 말한 거 어떻게 됐어?"처럼 자연스럽게 되짚어줘요
              </p>
            </div>
          </div>
        )}
      </div>

      {editingApp && (
        <button
          onClick={() => onDelete(editingApp)}
          className="mb-3 text-sm font-medium text-[#ff453a] active:opacity-70"
        >
          이 앱 삭제하기
        </button>
      )}

      <Button
        disabled={!selected}
        onClick={() => onConfirm({ app: selected, limitMinutes, personaId, interests, plan })}
      >
        {editingApp ? '저장' : '추가'}
      </Button>
    </div>
  )
}
