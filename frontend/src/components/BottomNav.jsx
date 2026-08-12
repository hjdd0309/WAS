import BellIcon from './BellIcon'

const navIcons = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3 3 10.5V21h6v-6h6v6h6V10.5L12 3Z" />
    </svg>
  ),
  log: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="13" width="3.4" height="7" rx="1" />
      <rect x="10.3" y="9" width="3.4" height="11" rx="1" />
      <rect x="16.6" y="4" width="3.4" height="16" rx="1" />
    </svg>
  ),
  report: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  ),
  settings: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V19.5a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H4.5a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 6.1 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H10.5a1.65 1.65 0 0 0 1-1.51V4.5a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V10.5a1.65 1.65 0 0 0 1.51 1H19.5a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  ),
}

const tabs = [
  { id: 'home', label: '홈' },
  { id: 'log', label: '기록' },
  { id: 'report', label: '리포트' },
  { id: 'settings', label: '설정' },
]

export default function BottomNav({ active = 'home', onNavigate, onCallPress }) {
  return (
    <div className="relative shrink-0 border-t border-[#695b69]/50 bg-[#1d191d] px-6 pb-2 pt-4">
      <div className="flex items-center justify-between">
        {tabs.slice(0, 2).map((tab) => (
          <button
            key={tab.id}
            onClick={() => onNavigate?.(tab.id)}
            className={`flex flex-col items-center gap-1 px-2 active:opacity-70 ${
              active === tab.id ? 'text-white' : 'text-[#a6a6a6]'
            }`}
          >
            {navIcons[tab.id]}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}

        <span className="w-14 shrink-0" aria-hidden="true" />

        {tabs.slice(2).map((tab) => (
          <button
            key={tab.id}
            onClick={() => onNavigate?.(tab.id)}
            className={`flex flex-col items-center gap-1 px-2 active:opacity-70 ${
              active === tab.id ? 'text-white' : 'text-[#a6a6a6]'
            }`}
          >
            {navIcons[tab.id]}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={onCallPress}
        aria-label="지금 통화하기"
        className="absolute left-1/2 top-0 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-black shadow-[0_0_0_3px_rgba(251,218,254,0.6),0_8px_20px_rgba(177,144,234,0.5)] ring-2 ring-[#ff453a]/70 active:opacity-80"
      >
        <BellIcon size={26} />
      </button>
    </div>
  )
}
