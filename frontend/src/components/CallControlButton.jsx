const icons = {
  mute: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
      <path d="M12 18v3" />
      <path d="M3 3l18 18" />
    </svg>
  ),
  keypad: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      {[3, 11, 19].flatMap((y) =>
        [3, 11, 19].map((x) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2" />
        )),
      )}
    </svg>
  ),
  speaker: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="M17 8a5 5 0 0 1 0 8" />
      <path d="M20 5a9 9 0 0 1 0 14" />
    </svg>
  ),
  addcall: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c.8-3 3-4.6 6-4.6s5.2 1.6 6 4.6" />
      <path d="M18 8v5" />
      <path d="M15.5 10.5h5" />
    </svg>
  ),
  facetime: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="14" height="12" rx="2.5" />
      <path d="M16 10.5 22 7v10l-6-3.5Z" strokeLinejoin="round" />
    </svg>
  ),
  contacts: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.2-4 3.9-6 7.5-6s6.3 2 7.5 6" />
    </svg>
  ),
}

export default function CallControlButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2"
    >
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-full backdrop-blur-md transition-colors active:opacity-70 ${
          active ? 'bg-white text-black' : 'bg-white/15 text-white'
        }`}
      >
        {icons[icon]}
      </span>
      <span className="text-[13px] text-white/70">{label}</span>
    </button>
  )
}
