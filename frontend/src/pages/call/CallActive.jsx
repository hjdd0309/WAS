import { useEffect, useRef, useState } from 'react'
import { formatDuration } from '../../hooks/useCallTimer'

export default function CallActive({ persona, transcript, aiSpeaking, muted, onToggleMute, onHangup }) {
  const [elapsed, setElapsed] = useState(0)
  const transcriptEndRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [transcript])

  return (
    <div className="flex h-full w-full flex-col bg-black px-6 pb-8 pt-10">
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-20 items-center justify-center rounded-full bg-white/10 text-4xl">
          {persona.emoji}
        </div>
        <p className="text-[22px] font-bold text-white">{persona.name}</p>
        <p className="text-[14px] text-white/50">{formatDuration(elapsed)}</p>
      </div>

      <div className="my-5 flex h-10 items-end justify-center gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="w-1.5 rounded-full bg-accent transition-all duration-150"
            style={{
              height: aiSpeaking ? `${10 + ((i * 37) % 26)}px` : '6px',
              opacity: aiSpeaking ? 1 : 0.3,
            }}
          />
        ))}
      </div>

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-1">
        {transcript.length === 0 && (
          <p className="pt-6 text-center text-[12px] text-white/40">
            {persona.name}이(가) 곧 말을 걸어올 거예요
          </p>
        )}
        {transcript.map((line, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-[1.5] ${
              line.speaker === 'user'
                ? 'ml-auto rounded-tr-sm bg-accent text-black'
                : 'rounded-tl-sm bg-white/10 text-white'
            }`}
          >
            {line.text}
          </div>
        ))}
        <div ref={transcriptEndRef} />
      </div>

      <div className="flex items-center justify-center gap-8 pt-6">
        <button
          onClick={() => onToggleMute(!muted)}
          aria-label={muted ? '음소거 해제' : '음소거'}
          aria-pressed={muted}
          className={`flex size-14 items-center justify-center rounded-full transition-colors active:opacity-70 ${
            muted ? 'bg-white text-black' : 'bg-white/10 text-white'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
            <path d="M12 18v3" />
            {muted && <path d="M3 3l18 18" />}
          </svg>
        </button>

        <button
          onClick={onHangup}
          aria-label="통화 종료"
          className="flex size-[72px] items-center justify-center rounded-full bg-[#ff453a] shadow-[0_6px_16px_rgba(0,0,0,0.35)] active:opacity-70"
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
            style={{ transform: 'rotate(135deg)' }}
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
