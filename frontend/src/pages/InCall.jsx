import { useEffect, useRef, useState } from 'react'
import CallControlButton from '../components/CallControlButton'
import StatusBar from '../components/StatusBar'
import useCallTimer, { formatDuration } from '../hooks/useCallTimer'

export default function InCall({ onEnd, onConnected }) {
  const [connected, setConnected] = useState(false)
  const seconds = useCallTimer(connected)
  const [muted, setMuted] = useState(false)
  const [speaker, setSpeaker] = useState(false)
  const [micDenied, setMicDenied] = useState(false)
  const streamRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setConnected(true)
      onConnected?.()
    }, 800)
    return () => clearTimeout(timer)
    // runs once when the call screen mounts
  }, [])

  useEffect(() => {
    let cancelled = false

    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
      })
      .catch(() => setMicDenied(true))

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev
      streamRef.current
        ?.getAudioTracks()
        .forEach((track) => {
          track.enabled = !next
        })
      return next
    })
  }

  return (
    <div className="flex h-full w-full flex-col justify-between bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] px-8 pb-10 pt-3">
      <StatusBar />

      <div className="flex flex-col items-center gap-2">
        <p className="text-[15px] text-white/60">
          {connected ? formatDuration(seconds) : '연결 중...'}
        </p>
        <p className="text-[32px] font-bold text-white">WAS AI</p>
        {micDenied && (
          <p className="mt-1 text-[13px] text-[#ff453a]">
            마이크 권한이 없어 음소거를 실제로 적용할 수 없어요
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-8">
        {connected && (
          <div className="grid grid-cols-3 gap-x-6 gap-y-6">
            <CallControlButton
              icon="mute"
              label="음소거"
              active={muted}
              onClick={toggleMute}
            />
            <CallControlButton icon="keypad" label="키패드" />
            <CallControlButton
              icon="speaker"
              label="스피커"
              active={speaker}
              onClick={() => setSpeaker((s) => !s)}
            />
            <CallControlButton icon="addcall" label="통화 추가" />
            <CallControlButton icon="facetime" label="FaceTime" />
            <CallControlButton icon="contacts" label="연락처" />
          </div>
        )}

        <button
          onClick={() => onEnd(seconds)}
          aria-label="통화 종료"
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#ff453a] shadow-[0_6px_16px_rgba(0,0,0,0.35)] active:opacity-70"
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
