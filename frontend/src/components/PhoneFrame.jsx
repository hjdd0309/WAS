export default function PhoneFrame({ children, onHomeGesture }) {
  return (
    <div className="flex h-dvh w-full items-center justify-center overflow-hidden bg-black sm:p-6">
      <div className="relative h-full w-full overflow-hidden bg-black sm:aspect-[390/844] sm:h-full sm:w-auto sm:max-h-[844px] sm:rounded-[40px] sm:border sm:border-white/10">
        {children}

        <div className="pointer-events-none absolute left-1/2 top-2.5 z-50 hidden h-[26px] w-[100px] -translate-x-1/2 rounded-full bg-black sm:block" />

        <button
          onClick={onHomeGesture}
          aria-label="홈으로"
          disabled={!onHomeGesture}
          className={`absolute bottom-0 left-1/2 z-50 hidden h-7 w-40 -translate-x-1/2 items-end justify-center pb-1.5 sm:flex ${
            onHomeGesture ? '' : 'pointer-events-none'
          }`}
        >
          <span className="h-1 w-32 rounded-full bg-white" />
        </button>
      </div>
    </div>
  )
}
