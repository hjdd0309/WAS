import { useState } from 'react'
import BottomNav from '../components/BottomNav'
import ScreenHeader from '../components/ScreenHeader'
import MonitorSetupForm from '../components/MonitorSetupForm'

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-white/15'
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#767676" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

function Row({ label, right, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`flex w-full items-center justify-between px-5 py-3.5 text-left ${
        onClick ? 'active:opacity-60' : ''
      }`}
    >
      <span className="text-[14px] text-white">{label}</span>
      {right}
    </Tag>
  )
}

export default function Settings({ app, persona, limitMinutes, onUpdateProfile, onNavigate, onCallPress }) {
  const [editing, setEditing] = useState(false)
  const [notif, setNotif] = useState(true)
  const [sound, setSound] = useState(true)

  const [draft, setDraft] = useState({ appId: app.id, limitMinutes, personaId: persona.id })

  const startEdit = () => {
    setDraft({ appId: app.id, limitMinutes, personaId: persona.id })
    setEditing(true)
  }

  const save = () => {
    onUpdateProfile(draft)
    setEditing(false)
  }

  return (
    <div className="flex h-full w-full flex-col bg-black">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-6">
        <ScreenHeader title="설정" subtitle="위스피를 나에게 맞게 조정해요" />

        <div className="mt-5 rounded-[20px] border border-[#695b69]/60 bg-[#1d191d] p-5">
          {!editing ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold text-white">모니터링 설정</p>
                <button
                  onClick={startEdit}
                  className="text-[12px] font-medium text-accent-soft active:opacity-70"
                >
                  수정
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="size-11 shrink-0 overflow-hidden rounded-[10px]">
                  <img src={app.icon} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-white">{app.name}</p>
                  <p className="text-[12px] text-[#919191]">{limitMinutes}분이 넘으면 전화가 와요</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-[14px] bg-white/5 px-3.5 py-2.5">
                <span className="text-base">{persona.emoji}</span>
                <p className="text-[12px] text-white">
                  &lsquo;{persona.name}&rsquo;이(가) 먼저 전화할게요
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="mb-4 text-[14px] font-semibold text-white">모니터링 설정 수정</p>
              <MonitorSetupForm
                selectedAppId={draft.appId}
                onSelectApp={(appId) => setDraft((d) => ({ ...d, appId }))}
                limitMinutes={draft.limitMinutes}
                onChangeLimit={(limitMinutes) => setDraft((d) => ({ ...d, limitMinutes }))}
                personaId={draft.personaId}
                onSelectPersona={(personaId) => setDraft((d) => ({ ...d, personaId }))}
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="h-12 flex-1 rounded-[16px] bg-white/10 text-[14px] font-semibold text-white active:opacity-70"
                >
                  취소
                </button>
                <button
                  onClick={save}
                  className="h-12 flex-1 rounded-[16px] bg-accent text-[14px] font-semibold text-black active:opacity-70"
                >
                  저장
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 divide-y divide-white/10 overflow-hidden rounded-[20px] border border-[#695b69]/60 bg-[#1d191d]">
          <Row label="알림" right={<Toggle checked={notif} onChange={setNotif} />} />
          <Row label="사운드" right={<Toggle checked={sound} onChange={setSound} />} />
          <Row label="다크 모드" right={<span className="text-[12px] text-[#919191]">항상 켜짐</span>} />
        </div>

        <div className="mt-4 divide-y divide-white/10 overflow-hidden rounded-[20px] border border-[#695b69]/60 bg-[#1d191d]">
          <Row label="개인정보 처리방침" right={<Chevron />} />
          <Row label="이용약관" right={<Chevron />} />
          <Row label="문의하기" right={<Chevron />} />
        </div>

        <p className="mt-6 text-center text-[12px] text-[#4b4750]">위스피 1.0.0</p>
      </div>

      <BottomNav active="settings" onNavigate={onNavigate} onCallPress={onCallPress} />
    </div>
  )
}
