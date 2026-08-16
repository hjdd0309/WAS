import { useState } from 'react'
import BottomNav from '../components/BottomNav'
import ScreenHeader from '../components/ScreenHeader'
import HomeScreenInstallCard from '../components/HomeScreenInstallCard'
import NotificationPermissionCard from '../components/NotificationPermissionCard'

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

export default function Settings({ monitoredApps, onManageApps, onNavigate, onCallPress }) {
  const [sound, setSound] = useState(true)

  return (
    <div className="flex h-full w-full flex-col bg-[#1b171c]">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-6">
        <ScreenHeader title="설정" subtitle="잠깐만을 나에게 맞게 조정해요" />

        <button
          onClick={onManageApps}
          className="mt-5 flex w-full items-center justify-between rounded-[20px] border border-[#695b69]/60 bg-[#1d191d] p-5 text-left active:opacity-70"
        >
          <div>
            <p className="text-[14px] font-semibold text-white">모니터링 앱 관리</p>
            <p className="mt-1 text-[12px] text-[#919191]">
              {monitoredApps.length === 0
                ? '아직 등록한 앱이 없어요'
                : `${monitoredApps.length}개 앱 모니터링 중`}
            </p>
          </div>
          <Chevron />
        </button>

        <div className="mt-4 flex flex-col gap-3">
          <HomeScreenInstallCard />
          <NotificationPermissionCard />
        </div>

        <div className="mt-4 divide-y divide-white/10 overflow-hidden rounded-[20px] border border-[#695b69]/60 bg-[#1d191d]">
          <Row label="사운드" right={<Toggle checked={sound} onChange={setSound} />} />
          <Row label="다크 모드" right={<span className="text-[12px] text-[#919191]">항상 켜짐</span>} />
        </div>

        <div className="mt-4 divide-y divide-white/10 overflow-hidden rounded-[20px] border border-[#695b69]/60 bg-[#1d191d]">
          <Row label="개인정보 처리방침" right={<Chevron />} />
          <Row label="이용약관" right={<Chevron />} />
          <Row label="문의하기" right={<Chevron />} />
        </div>

        <p className="mt-6 text-center text-[12px] text-[#4b4750]">잠깐만 1.0.0</p>
      </div>

      <BottomNav active="settings" onNavigate={onNavigate} onCallPress={onCallPress} />
    </div>
  )
}
