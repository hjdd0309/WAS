export default function StatusBar() {
  return (
    <div className="flex items-center justify-between px-2 text-[15px] font-semibold text-white">
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="white">
          <rect x="0" y="6" width="3" height="5" rx="0.6" />
          <rect x="4.5" y="4" width="3" height="7" rx="0.6" />
          <rect x="9" y="2" width="3" height="9" rx="0.6" />
          <rect x="13.5" y="0" width="3" height="11" rx="0.6" />
        </svg>
        <svg
          width="15"
          height="11"
          viewBox="0 0 15 11"
          fill="none"
          stroke="white"
          strokeWidth="1.4"
          strokeLinecap="round"
        >
          <path d="M1 4.2a9.5 9.5 0 0 1 13 0" />
          <path d="M3.4 6.9a5.9 5.9 0 0 1 8.2 0" />
          <path d="M5.9 9.5a2.4 2.4 0 0 1 3.2 0" />
        </svg>
        <div className="flex items-center">
          <div className="relative h-[11px] w-[23px] rounded-[3px] border border-white/70">
            <div className="absolute inset-[1.5px] right-auto w-[75%] rounded-[1px] bg-white" />
          </div>
          <div className="ml-[1px] h-[4px] w-[1.5px] rounded-r bg-white/70" />
        </div>
      </div>
    </div>
  )
}
