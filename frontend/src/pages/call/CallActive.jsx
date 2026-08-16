import { useEffect, useState } from 'react'
import { formatDuration } from '../../hooks/useCallTimer'

const KEYPAD_KEYS = [
  ['1', ''],
  ['2', 'ABC'],
  ['3', 'DEF'],
  ['4', 'GHI'],
  ['5', 'JKL'],
  ['6', 'MNO'],
  ['7', 'PQRS'],
  ['8', 'TUV'],
  ['9', 'WXYZ'],
  ['*', ''],
  ['0', '+'],
  ['#', ''],
]

function MuteIcon({ muted }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
      <path d="M12 18v3" />
      {muted && <path d="M3 3l18 18" />}
    </svg>
  )
}

function KeypadIcon() {
  const cols = [5, 12, 19]
  const rows = [4, 10, 16, 22]
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      {rows.map((y) => cols.map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" />))}
    </svg>
  )
}

function SpeakerIcon({ on }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      {on && (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 6a9 9 0 0 1 0 12" />
        </>
      )}
    </svg>
  )
}

function HangupIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: 'rotate(135deg)' }}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  )
}

function PersonAddIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 4.2 1.72" />
      <path d="M19 8v6" />
      <path d="M16 11h6" />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
    </svg>
  )
}

function CallControlButton({ label, active, onClick, icon, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      aria-label={label}
      aria-pressed={active}
      aria-disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl py-4 transition-colors ${
        disabled
          ? 'pointer-events-none bg-white/5 text-white/30'
          : `active:opacity-70 ${active ? 'bg-white text-black' : 'bg-white/10 text-white'}`
      }`}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  )
}

export default function CallActive({ persona, aiSpeaking, muted, speakerOn, onToggleMute, onToggleSpeaker, onHangup }) {
  const [elapsed, setElapsed] = useState(0)
  const [keypadOpen, setKeypadOpen] = useState(false)
  const [dialed, setDialed] = useState('')

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="flex h-full w-full flex-col px-6 pb-10 pt-20"
      style={{
        backgroundImage: 'linear-gradient(204deg, rgba(251,218,254,0.2) 9%, rgba(36,30,40,0.2) 85%), #1b171c',
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <p className="text-[20px] text-[#b9b9b9]">
          {keypadOpen && dialed ? dialed : formatDuration(elapsed)}
        </p>
        <p
          className={`text-[45px] font-extrabold transition-all duration-500 ${
            aiSpeaking ? 'animate-pulse text-white drop-shadow-[0_0_18px_rgba(177,144,234,0.55)]' : 'text-white'
          }`}
        >
          {persona.name}
        </p>
      </div>

      <div className="flex-1" />

      {keypadOpen ? (
        <div className="mb-2">
          <div className="grid grid-cols-3 gap-x-6 gap-y-4 px-4">
            {KEYPAD_KEYS.map(([digit, letters]) => (
              <button
                key={digit}
                onClick={() => setDialed((prev) => (prev + digit).slice(-24))}
                aria-label={`숫자 ${digit}`}
                className="flex aspect-square flex-col items-center justify-center rounded-full bg-white/10 active:bg-white/20"
              >
                <span className="text-[26px] font-medium text-white">{digit}</span>
                {letters && <span className="text-[9px] tracking-[2px] text-white/40">{letters}</span>}
              </button>
            ))}
          </div>
          <button
            onClick={() => setKeypadOpen(false)}
            className="mt-4 w-full text-center text-[13px] font-medium text-white/50 active:opacity-70"
          >
            키패드 숨기기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-x-6 gap-y-5 px-2">
          <CallControlButton label="음소거" active={muted} onClick={() => onToggleMute(!muted)} icon={<MuteIcon muted={muted} />} />
          <CallControlButton label="키패드" active={keypadOpen} onClick={() => setKeypadOpen(true)} icon={<KeypadIcon />} />
          <CallControlButton
            label="스피커"
            active={speakerOn}
            onClick={() => onToggleSpeaker(!speakerOn)}
            icon={<SpeakerIcon on={speakerOn} />}
          />
          <CallControlButton label="통화 추가" disabled icon={<PersonAddIcon />} />
          <CallControlButton label="메시지" disabled icon={<MessageIcon />} />
          <CallControlButton label="연락처" disabled icon={<PersonIcon />} />
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <button
          onClick={onHangup}
          aria-label="통화 종료"
          className="flex size-[72px] items-center justify-center rounded-full bg-accent shadow-[0_6px_16px_rgba(0,0,0,0.35)] active:opacity-70"
        >
          <HangupIcon />
        </button>
      </div>
    </div>
  )
}
