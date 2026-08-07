export default function PhoneFrame({ children, activity = 'none', onHomeGesture }) {
  return (
    <div className="flex h-dvh w-full items-center justify-center overflow-hidden bg-[#f2f4f6] sm:p-6">
      <div className="relative h-full w-full overflow-hidden bg-white sm:aspect-[390/844] sm:h-full sm:w-auto sm:max-h-[844px] sm:rounded-[40px] sm:border sm:border-black/5">
        {children}
        <div
          className={`pointer-events-none absolute left-1/2 top-2.5 z-50 hidden h-[26px] w-[100px] -translate-x-1/2 items-center rounded-full bg-black px-2.5 sm:flex ${
            activity === 'active' ? 'justify-between' : 'justify-center'
          }`}
        >
          {activity === 'ringing' && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#30d158]" />
          )}
          {activity === 'active' && (
            <>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#30d158]" />
              <span className="flex items-end gap-[2px]">
                {[3, 6, 4].map((h, i) => (
                  <span
                    key={i}
                    className="w-[2px] animate-pulse rounded-full bg-[#30d158]"
                    style={{ height: h, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            </>
          )}
        </div>
        <button
          onClick={onHomeGesture}
          aria-label="홈으로"
          disabled={!onHomeGesture}
          className={`absolute bottom-0 left-1/2 z-50 hidden h-7 w-40 -translate-x-1/2 items-end justify-center pb-1.5 sm:flex ${
            onHomeGesture ? '' : 'pointer-events-none'
          }`}
        >
          <span className="h-1 w-32 rounded-full bg-white mix-blend-difference" />
        </button>
      </div>
    </div>
  )
}
