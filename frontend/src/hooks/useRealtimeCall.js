import { useCallback, useRef, useState } from 'react'

// 배포 시 반드시 실제 백엔드 URL로 오버라이드해야 함 (frontend/.env.example 참고).
// 백엔드는 프론트와 별도로 배포되므로(Vercel 등) 상대 경로로는 닿지 않는다.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const APP_SECRET = import.meta.env.VITE_APP_SHARED_SECRET || ''

// 매 응답 직전에 톤을 다시 상기시켜, 대화가 길어질수록 모델이 시스템
// instructions을 덜 따르는 문제를 보완한다 (원본: feature/persona-presets 브랜치).
const TONE_REMINDER =
  '[내부 지시 — 사용자에게 보이지 않음] 지금까지의 텐션과 편한 반말 톤을 그대로 유지해. 문장을 정중하거나 완벽하게 다듬지 말고, 추임새(음, 어, 그니까)를 섞어서 편하게 대답해. 방금 전에 썼던 표현이나 문장 구조를 반복하지 말고 새롭게 말해.'

const ERROR_MESSAGES = {
  network: '통화 서버에 연결할 수 없어요. 네트워크를 확인해주세요.',
  session: '통화를 시작할 수 없어요. 잠시 후 다시 시도해주세요.',
  mic: '마이크 권한이 필요해요. 브라우저 설정에서 허용해주세요.',
  webrtc: '통화 연결에 실패했어요. 다시 시도해주세요.',
}

/**
 * OpenAI Realtime API와 브라우저가 WebRTC로 직접 붙는 통화 세션 훅.
 * 백엔드(`POST /api/call`)는 임시 client_secret 발급만 담당하고,
 * 오디오 스트림 자체는 이 훅이 브라우저 ↔ OpenAI 사이에서 직접 주고받는다.
 */
export default function useRealtimeCall() {
  // idle | connecting | connected | ended | error
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [transcript, setTranscript] = useState([])
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [muted, setMutedState] = useState(false)
  const [speakerBoost, setSpeakerBoostState] = useState(false)

  const pcRef = useRef(null)
  const micStreamRef = useRef(null)
  const audioElRef = useRef(null)
  const audioCtxRef = useRef(null)
  const gainNodeRef = useRef(null)
  const dcRef = useRef(null)
  const currentAiIndexRef = useRef(null)
  const startedRef = useRef(false)
  const responseInFlightRef = useRef(false)

  const handleEvent = useCallback((event) => {
    switch (event.type) {
      case 'response.created': {
        responseInFlightRef.current = true
        break
      }
      case 'response.done': {
        // AI 응답 종료 직후 잠깐 더 가드를 유지 — 에코 캔슬레이션이 완벽하지
        // 않아 AI 목소리 꼬리가 마이크에 다시 잡혀 응답이 겹쳐 발생하는 걸 방지.
        setTimeout(() => {
          responseInFlightRef.current = false
        }, 600)
        break
      }
      case 'response.output_audio_transcript.delta': {
        setAiSpeaking(true)
        setTranscript((prev) => {
          const next = [...prev]
          const idx = currentAiIndexRef.current
          if (idx === null || !next[idx] || next[idx].done) {
            next.push({ speaker: 'ai', text: event.delta ?? '', done: false })
            currentAiIndexRef.current = next.length - 1
          } else {
            next[idx] = { ...next[idx], text: next[idx].text + (event.delta ?? '') }
          }
          return next
        })
        break
      }
      case 'response.output_audio_transcript.done': {
        setAiSpeaking(false)
        setTranscript((prev) => {
          const next = [...prev]
          const idx = currentAiIndexRef.current
          if (idx !== null && next[idx]) next[idx] = { ...next[idx], done: true }
          return next
        })
        currentAiIndexRef.current = null
        break
      }
      case 'conversation.item.input_audio_transcription.completed': {
        if (event.transcript?.trim()) {
          setTranscript((prev) => [
            ...prev,
            { speaker: 'user', text: event.transcript ?? '', done: true },
          ])
        }
        break
      }
      case 'input_audio_buffer.speech_started': {
        setAiSpeaking(false)
        break
      }
      case 'input_audio_buffer.speech_stopped': {
        // AI가 이미 말하는 중이면 스킵 — 대부분 마이크가 AI 목소리(에코)를
        // 주운 것이지 실제 사용자 발화가 아니며, 여기서 응답을 또 트리거하면
        // 응답이 꼬리를 물고 반복되는 루프가 생긴다.
        if (responseInFlightRef.current) break

        const dc = dcRef.current
        if (dc && dc.readyState === 'open') {
          dc.send(
            JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'system',
                content: [{ type: 'input_text', text: TONE_REMINDER }],
              },
            }),
          )
          dc.send(JSON.stringify({ type: 'response.create' }))
        }
        break
      }
      case 'error': {
        console.error('realtime session error event', event.error)
        break
      }
      default:
        break
    }
  }, [])

  const teardown = useCallback(() => {
    dcRef.current?.close()
    dcRef.current = null
    pcRef.current?.getSenders().forEach((s) => s.track?.stop())
    pcRef.current?.close()
    pcRef.current = null
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
    micStreamRef.current = null
    if (audioElRef.current) {
      audioElRef.current.pause()
      audioElRef.current.srcObject = null
      audioElRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    gainNodeRef.current = null
    setAiSpeaking(false)
  }, [])

  const hangup = useCallback(() => {
    teardown()
    setStatus((s) => (s === 'error' ? s : 'ended'))
  }, [teardown])

  const connect = useCallback(
    async (onboarding = {}) => {
      if (startedRef.current) return
      startedRef.current = true
      setStatus('connecting')
      setErrorMessage('')

      try {
        const headers = { 'Content-Type': 'application/json' }
        if (APP_SECRET) headers['x-app-secret'] = APP_SECRET

        let sessionRes
        try {
          sessionRes = await fetch(`${API_BASE}/api/call`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              interests: onboarding.interests ?? [],
              plan: onboarding.plan ?? '',
              personaId: onboarding.personaId,
              previousSummary: onboarding.previousSummary || undefined,
            }),
          })
        } catch {
          throw new Error('network')
        }

        if (!sessionRes.ok) throw new Error('session')

        const data = await sessionRes.json().catch(() => null)
        const clientSecret = data?.client_secret
        if (!clientSecret) throw new Error('session')

        let micStream
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          })
        } catch {
          throw new Error('mic')
        }
        micStreamRef.current = micStream

        const pc = new RTCPeerConnection()
        pcRef.current = pc
        micStream.getTracks().forEach((track) => pc.addTrack(track, micStream))

        const audioEl = new Audio()
        audioEl.autoplay = true
        audioElRef.current = audioEl

        pc.ontrack = (e) => {
          audioEl.srcObject = e.streams[0]
          // 스피커 볼륨 부스트를 위해 WebAudio 그래프로 출력을 우회시킨다.
          // 지원되지 않는 브라우저에서는 catch에서 audioEl 자체 재생으로 폴백.
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext
            const ctx = audioCtxRef.current ?? new AudioCtx()
            audioCtxRef.current = ctx
            const gainNode = ctx.createGain()
            gainNode.gain.value = speakerBoost ? 1.6 : 1
            gainNode.connect(ctx.destination)
            gainNodeRef.current = gainNode
            const source = ctx.createMediaStreamSource(e.streams[0])
            source.connect(gainNode)
            audioEl.muted = true
          } catch {
            audioEl.muted = false
          }
        }

        const dc = pc.createDataChannel('oai-events')
        dcRef.current = dc
        dc.onmessage = (e) => {
          try {
            handleEvent(JSON.parse(e.data))
          } catch {
            // 잘못된 형식의 이벤트는 무시
          }
        }
        dc.onopen = () => {
          setStatus('connected')
          // AI가 먼저 말을 걸도록 연결 직후 응답 생성을 트리거
          dc.send(JSON.stringify({ type: 'response.create' }))
        }

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        let sdpRes
        try {
          sdpRes = await fetch('https://api.openai.com/v1/realtime/calls', {
            method: 'POST',
            body: offer.sdp,
            headers: {
              Authorization: `Bearer ${clientSecret}`,
              'Content-Type': 'application/sdp',
            },
          })
        } catch {
          throw new Error('webrtc')
        }

        if (!sdpRes.ok) throw new Error('webrtc')

        const answerSdp = await sdpRes.text()
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })
      } catch (err) {
        console.error('realtime call failed', err)
        teardown()
        const key = err instanceof Error && ERROR_MESSAGES[err.message] ? err.message : 'webrtc'
        setErrorMessage(ERROR_MESSAGES[key])
        setStatus('error')
      }
    },
    [handleEvent, teardown, speakerBoost],
  )

  const retry = useCallback(
    (onboarding) => {
      startedRef.current = false
      currentAiIndexRef.current = null
      responseInFlightRef.current = false
      setTranscript([])
      connect(onboarding)
    },
    [connect],
  )

  const setMuted = useCallback((next) => {
    setMutedState(next)
    micStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next
    })
  }, [])

  const setSpeakerBoost = useCallback((next) => {
    setSpeakerBoostState(next)
    if (gainNodeRef.current) gainNodeRef.current.gain.value = next ? 1.6 : 1
  }, [])

  return {
    status,
    errorMessage,
    transcript,
    aiSpeaking,
    muted,
    speakerBoost,
    connect,
    retry,
    hangup,
    setMuted,
    setSpeakerBoost,
  }
}
