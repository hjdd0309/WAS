import { useEffect, useRef, useState } from 'react'
import useRealtimeCall from '../hooks/useRealtimeCall'
import CallConnecting from './call/CallConnecting'
import CallActive from './call/CallActive'
import CallSummaryScreen from './call/CallSummaryScreen'

const MAX_SUMMARY_LENGTH = 480

// 통화 종료 후 다음 통화의 "기억"으로 쓸 짧은 요약을 최근 대화 몇 마디로
// 대충 뽑아둔다 — 별도 LLM 요약 호출 없이, 백엔드가 프롬프트에 가볍게
// 참고만 하는 용도라 정교할 필요는 없다.
function deriveSummary(transcript) {
  const lines = transcript.filter((line) => line.done && line.text.trim())
  if (lines.length === 0) return ''
  const recent = lines.slice(-4)
  const text = recent
    .map((line) => (line.speaker === 'user' ? `나: ${line.text}` : `상대: ${line.text}`))
    .join(' / ')
  return text.slice(0, MAX_SUMMARY_LENGTH)
}

export default function CallSplash({ app, persona, profile, onHome, onSaveSummary }) {
  const call = useRealtimeCall()
  const startedAtRef = useRef(null)
  const [duration, setDuration] = useState(0)

  const callPayload = {
    interests: profile.interests,
    plan: profile.plan,
    personaId: profile.personaId,
    previousSummary: profile.previousSummary,
  }

  useEffect(() => {
    call.connect(callPayload)
    // 마운트 시 한 번만 연결을 시작한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (call.status === 'connected' && !startedAtRef.current) {
      startedAtRef.current = Date.now()
    }
  }, [call.status])

  const handleHangup = () => {
    if (startedAtRef.current) {
      setDuration(Math.floor((Date.now() - startedAtRef.current) / 1000))
    }
    onSaveSummary?.(deriveSummary(call.transcript))
    call.hangup()
  }

  const handleRetry = () => call.retry(callPayload)

  if (call.status === 'connected') {
    return (
      <CallActive
        persona={persona}
        transcript={call.transcript}
        aiSpeaking={call.aiSpeaking}
        muted={call.muted}
        onToggleMute={call.setMuted}
        onHangup={handleHangup}
      />
    )
  }

  if (call.status === 'ended') {
    return <CallSummaryScreen app={app} persona={persona} duration={duration} onHome={onHome} />
  }

  return (
    <CallConnecting
      status={call.status}
      errorMessage={call.errorMessage}
      onRetry={handleRetry}
      onCancel={onHome}
    />
  )
}
