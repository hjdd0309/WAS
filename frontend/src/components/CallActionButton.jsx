export default function CallActionButton({ type, onClick, label }) {
  const isAccept = type === 'accept'

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex h-[72px] w-[72px] items-center justify-center rounded-full shadow-[0_6px_16px_rgba(0,0,0,0.35)] transition-opacity active:opacity-70 ${
        isAccept ? 'bg-[#30d158]' : 'bg-[#ff453a]'
      }`}
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: isAccept ? 'none' : 'rotate(135deg)' }}
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
      </svg>
    </button>
  )
}
