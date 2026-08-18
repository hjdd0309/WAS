import { useCallback, useRef, useState } from 'react'
import { fetchCallSession, takePrefetchedSession } from '../lib/callSession'

// 매 응답 직전에 톤을 다시 상기시켜, 대화가 길어질수록 모델이 시스템
// instructions을 덜 따르는 문제를 보완한다.
const TONE_REMINDER =
  '[내부 지시 — 사용자에게 보이지 않음] 지금까지의 텐션과 존댓말 톤을 그대로 유지해. 문장을 딱딱하거나 완벽하게 다듬지 말고, 추임새(음, 어, 그니까)를 섞어서 편하게 대답해. 방금 전에 썼던 표현이나 문장 구조를 반복하지 말고 새롭게 말해. 반말("뭐 해?", "봤어?")로 새지 말고 반드시 존댓말("뭐 해요?", "봤어요?")로 끝낼 것 — 대화가 길어질수록 반말로 흘러가는 경향이 있으니 매번 스스로 점검해.'

// realtimeInstructions.ts의 "재정향(3단계, 반드시 수행)" 지시가 system prompt에만
// 있으면 대화가 몇 턴 이어지는 순간 모델이 놓치거나(gpt-realtime-mini라 특히)
// 구체적인 plan 대신 뭉뚱그린 질문으로 대체해버리는 문제를 실측으로 확인했다
// (예: "농구화 사기"를 전혀 언급 안 하고 "다른 계획 있어?"로 퉁침, 사용자가
// 끊겠다고 해도 plan 언급 없이 그냥 인사만 하고 끝냄). TONE_REMINDER와 같은
// 방식으로 매 턴마다 구체적인 plan 문구를 직접 박아 넣어 상기시켜 신뢰도를 높인다.
function buildPlanReminder(plan) {
  if (!plan) return ''
  return `\n\n[내부 지시 — 사용자에게 보이지 않음] 사용자가 요즘 하려는 일: "${plan}". 이 통화에서 이걸 단 한 번도 언급한 적이 없다면, 이번 응답이나 다음 응답에서 반드시 가볍게 물어봐("저번에 말한 ○○ 어떻게 됐어?" 식으로) — 뭉뚱그려서 "다른 계획 있어?"처럼 묻지 말고 반드시 위 구체적인 내용으로. 이 통화 중 단 한 번이라도 이미 언급했다면, 그 이후로는 절대 다시 묻거나 언급하지 말고 그냥 자연스럽게 흘러가.`
}

// <audio> 기본 volume은 1.0(최대)이라 안드로이드에서 AI 음성이 과도하게 크게
// 들리는 원인 중 하나였다. 소프트웨어 단에서 크게 낮춰 재생한다 — 다만
// 이건 볼륨 슬라이더가 아니라 고정 완화값이라, "미디어 볼륨"이 아닌 다른
// 오디오 스트림으로 라우팅되는 문제 자체를 고치진 못한다(아래 pc.ontrack 주석 참고).
const DEFAULT_PLAYBACK_VOLUME = 0.4

async function readClientSecret(res) {
  if (res.status === 429) throw new Error('busy')
  if (!res.ok) throw new Error('session')
  const data = await res.json().catch(() => null)
  if (!data?.client_secret) throw new Error('session')
  return data.client_secret
}

function postSdpOffer(clientSecret, sdp) {
  return fetch('https://api.openai.com/v1/realtime/calls', {
    method: 'POST',
    body: sdp,
    headers: {
      Authorization: `Bearer ${clientSecret}`,
      'Content-Type': 'application/sdp',
    },
  })
}

const ERROR_MESSAGES = {
  network: '통화 서버에 연결할 수 없어요. 네트워크를 확인해주세요.',
  session: '통화를 시작할 수 없어요. 잠시 후 다시 시도해주세요.',
  busy: '접속 인원이 많아 연결에 실패했어요. 조금만 기다린 후에 시도해주세요.',
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
  const [errorKind, setErrorKind] = useState('')
  const [transcript, setTranscript] = useState([])
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [muted, setMutedState] = useState(false)
  const [speakerBoost, setSpeakerBoostState] = useState(false)

  const pcRef = useRef(null)
  const micStreamRef = useRef(null)
  const audioElRef = useRef(null)
  const remoteStreamRef = useRef(null)
  const audioCtxRef = useRef(null)
  const gainNodeRef = useRef(null)
  const dcRef = useRef(null)
  const currentAiIndexRef = useRef(null)
  const startedRef = useRef(false)
  const responseInFlightRef = useRef(false)
  const micMutedByUserRef = useRef(false)
  const planRef = useRef('')
  // 연결 직후 첫 인사(첫 response) 도중엔 마이크를 아예 죽여둔다. 원격 오디오
  // 트랙이 막 붙은 시점엔 브라우저 에코 캔슬레이션이 그 트랙을 레퍼런스로
  // 잡기 전이라, AI 목소리가 마이크로 살짝 새어 들어가 서버 VAD가 "사용자가
  // 끼어들었다"고 오인 → interrupt_response:true로 응답을 취소 → 곧장 새
  // response.create가 나가면서 "말하다 끊기고 다시 시작"하는 것처럼 들리는
  // 문제가 있었다. 첫 응답이 끝날 때까지만 무음으로 보내 이 오탐을 원천 차단.
  const isFirstResponseRef = useRef(true)
  const micSuppressedForGreetingRef = useRef(true)

  const syncMicTrackEnabled = useCallback(() => {
    const enabled = !micMutedByUserRef.current && !micSuppressedForGreetingRef.current
    micStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled
    })
  }, [])

  const handleEvent = useCallback((event) => {
    switch (event.type) {
      case 'response.created': {
        responseInFlightRef.current = true
        break
      }
      case 'response.done': {
        // interrupt_response:true라 사용자가 끼어들면 서버가 진행 중이던 응답을
        // 자동 취소하는데, 그 결과가 바로 이 이벤트로 status: 'cancelled'로 온다.
        // 취소든 정상 종료든 여기서 즉시 상태를 정리해 다음 response.create가
        // 막히지 않게 한다.
        const cancelled = event.response?.status === 'cancelled'
        console.log(
          cancelled
            ? '[realtime] response.cancel 확인 — barge-in으로 서버가 응답을 취소함'
            : '[realtime] response.done',
          event.response?.status,
          event.response?.id,
        )
        responseInFlightRef.current = false
        if (isFirstResponseRef.current) {
          // 첫 응답(인사)이 끝났으니 억지로 죽여뒀던 마이크를 정상 상태로 돌린다.
          isFirstResponseRef.current = false
          micSuppressedForGreetingRef.current = false
          syncMicTrackEnabled()
        }
        if (cancelled) {
          // 잘려나간 AI 말풍선을 그대로 두면 영영 done:false로 남으니 마무리 처리.
          setTranscript((prev) => {
            const next = [...prev]
            const idx = currentAiIndexRef.current
            if (idx !== null && next[idx] && !next[idx].done) next[idx] = { ...next[idx], done: true }
            return next
          })
          currentAiIndexRef.current = null
          setAiSpeaking(false)
        }
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
      case 'input_audio_buffer.speech_started': {
        // 실제 오디오 트랙(WebRTC)을 여기서 끊거나 audioEl을 정지시킬 필요는
        // 없다 — interrupt_response:true라 서버가 응답 생성을 취소하면 그
        // 순간부터 오디오 델타 전송 자체가 멈추고, 취소 확정과 트랜스크립트/
        // responseInFlightRef 정리는 response.done(status: 'cancelled')에서 한다.
        if (responseInFlightRef.current) {
          console.log('[realtime] barge-in 감지 — AI 응답 재생 중 사용자 발화 시작, 서버 취소 대기')
        }
        setAiSpeaking(false)
        break
      }
      case 'input_audio_buffer.speech_stopped': {
        // 서버가 interrupt_response:true로 겹치는 응답을 알아서 취소해주므로,
        // AI가 말하는 중인지 여부와 무관하게 항상 response.create를 보낸다.
        const dc = dcRef.current
        if (dc && dc.readyState === 'open') {
          dc.send(
            JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'system',
                content: [{ type: 'input_text', text: TONE_REMINDER + buildPlanReminder(planRef.current) }],
              },
            }),
          )
          console.log('[realtime] response.create 전송 — 사용자 발화 종료 감지')
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
  }, [syncMicTrackEnabled])

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
    remoteStreamRef.current = null
    setAiSpeaking(false)
  }, [])

  // WebAudio 그래프를 통한 볼륨 부스트를 켜고 끈다. 켤 때만 audioEl을
  // 음소거하고 AudioContext/GainNode 경로로 우회 재생한다 — 끄면 다시
  // audioEl 기본 재생으로 되돌아가 에코 캔슬레이션 레퍼런스를 정상적으로 탄다.
  // setSinkId로 실제 수화구/스피커 라우팅이 안 되는 기기(iOS 등)에서 최소한의
  // 체감 차이라도 주기 위한 폴백 용도로만 쓴다 — applyAudioRoute 참고.
  const applyGainBoost = useCallback((enabled) => {
    const audioEl = audioElRef.current
    const remoteStream = remoteStreamRef.current
    if (!audioEl || !remoteStream) return

    if (!enabled) {
      if (gainNodeRef.current) gainNodeRef.current.gain.value = 1
      audioEl.muted = false
      return
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const ctx = audioCtxRef.current ?? new AudioCtx()
      audioCtxRef.current = ctx
      if (!gainNodeRef.current) {
        const gainNode = ctx.createGain()
        gainNode.connect(ctx.destination)
        const source = ctx.createMediaStreamSource(remoteStream)
        source.connect(gainNode)
        gainNodeRef.current = gainNode
      }
      gainNodeRef.current.gain.value = 1.6
      audioEl.muted = true
    } catch {
      audioEl.muted = false
    }
  }, [])

  // 실제 전화처럼: 스피커가 꺼져 있으면 수화구(이어피스)로, 켜져 있으면
  // 하단 스피커로 오디오 출력 자체를 전환한다. Android Chrome은 마이크
  // 권한이 이미 허용된 상태에서 enumerateDevices()로 "Earpiece"/"Speaker"
  // 같은 출력 장치를 따로 노출하는 경우가 있어, setSinkId로 그 장치를
  // 직접 골라 재생 경로를 바꿀 수 있다. 이어폰/블루투스가 연결돼 있으면
  // 사용자가 이미 고른 출력을 존중해 라우팅을 건드리지 않는다.
  // setSinkId 자체가 없거나(iOS Safari 등) 라우팅에 실패하면, 최소한의
  // 체감 차이라도 주기 위해 게인 부스트로 폴백한다.
  const applyAudioRoute = useCallback(
    async (speakerOn) => {
      const audioEl = audioElRef.current
      if (!audioEl) return

      let routed = false
      if (typeof audioEl.setSinkId === 'function' && navigator.mediaDevices?.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const outputs = devices.filter((d) => d.kind === 'audiooutput')
          const hasExternalOutput = outputs.some((d) => /bluetooth|headset|headphone|wired/i.test(d.label))
          if (!hasExternalOutput) {
            const wanted = speakerOn ? /speaker/i : /earpiece|receiver/i
            const target = outputs.find((d) => wanted.test(d.label))
            if (target) {
              await audioEl.setSinkId(target.deviceId)
              routed = true
              console.log(
                `[realtime] 오디오 출력 전환: ${speakerOn ? '스피커' : '수화구(이어피스)'}`,
                target.label,
              )
            }
          }
        } catch (err) {
          console.warn('[realtime] setSinkId 라우팅 실패 — 게인 부스트로 폴백', err)
        }
      }

      // 실제 장치 라우팅에 성공했으면 인위적 게인 부스트는 끈다 — 장치
      // 자체(수화구 vs 스피커)가 소리 크기 차이를 만들어준다.
      applyGainBoost(routed ? false : speakerOn)
    },
    [applyGainBoost],
  )

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
      setErrorKind('')

      try {
        const payload = {
          interests: onboarding.interests ?? [],
          plan: onboarding.plan ?? '',
          personaId: onboarding.personaId,
          previousSummary: onboarding.previousSummary || undefined,
        }
        planRef.current = payload.plan

        // 홈 화면에 머무는 동안 미리 받아둔 세션이 있으면 그걸 쓰고,
        // 없으면 지금 발급받는다 — 어느 쪽이든 마이크 캡처와 동시에 진행해
        // (둘은 서로 결과가 필요 없는 독립적인 작업이라) 순서대로 기다리며
        // 낭비하던 시간을 없앤다.
        const prefetched = takePrefetchedSession(payload)
        const sessionPromise = prefetched
          ? Promise.resolve(prefetched.clientSecret)
          : fetchCallSession(payload)
              .catch(() => {
                throw new Error('network')
              })
              .then(readClientSecret)

        const micPromise = navigator.mediaDevices
          .getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          })
          .catch(() => {
            throw new Error('mic')
          })

        const [initialClientSecret, micStream] = await Promise.all([sessionPromise, micPromise])
        let clientSecret = initialClientSecret
        micStreamRef.current = micStream
        syncMicTrackEnabled() // 첫 인사가 끝나기 전까진 무음으로 보냄

        const pc = new RTCPeerConnection()
        pcRef.current = pc
        micStream.getTracks().forEach((track) => pc.addTrack(track, micStream))

        const audioEl = new Audio()
        audioEl.autoplay = true
        audioEl.volume = DEFAULT_PLAYBACK_VOLUME
        audioElRef.current = audioEl

        pc.ontrack = (e) => {
          const remoteStream = e.streams[0]
          remoteStreamRef.current = remoteStream
          // 기본은 audioEl로 그대로 재생한다. WebAudio 그래프로 우회 재생하면
          // 브라우저(특히 Android Chrome)의 내장 에코 캔슬레이션이 재생 중인
          // 오디오를 레퍼런스로 잡지 못해, AI 목소리가 마이크로 다시 들어와
          // 엉뚱한 발화로 인식되는 문제가 생긴다. 실제 장치 라우팅이 안 될 때만
          // WebAudio 게인 폴백을 쓴다(applyAudioRoute 참고).
          audioEl.srcObject = remoteStream
          audioEl.muted = false
          audioEl.volume = DEFAULT_PLAYBACK_VOLUME
          audioEl.play().catch(() => {})
          // 통화가 시작될 때도 실제 전화처럼 기본은 수화구(스피커 off) 라우팅.
          applyAudioRoute(speakerBoost)
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
          sdpRes = await postSdpOffer(clientSecret, offer.sdp)
        } catch {
          sdpRes = null
        }

        // 미리 받아둔 세션은 홈 화면에 오래 머문 사이 만료됐을 수 있다 —
        // 그런 경우에 한해 새로 발급받아 한 번만 재시도한다.
        if ((!sdpRes || !sdpRes.ok) && prefetched) {
          try {
            clientSecret = await fetchCallSession(payload).then(readClientSecret)
            sdpRes = await postSdpOffer(clientSecret, offer.sdp)
          } catch {
            sdpRes = null
          }
        }

        if (!sdpRes || !sdpRes.ok) throw new Error('webrtc')

        const answerSdp = await sdpRes.text()
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })
      } catch (err) {
        console.error('realtime call failed', err)
        teardown()
        const key = err instanceof Error && ERROR_MESSAGES[err.message] ? err.message : 'webrtc'
        setErrorMessage(ERROR_MESSAGES[key])
        setErrorKind(key)
        setStatus('error')
      }
    },
    [handleEvent, teardown, speakerBoost, applyAudioRoute, syncMicTrackEnabled],
  )

  const retry = useCallback(
    (onboarding) => {
      startedRef.current = false
      currentAiIndexRef.current = null
      responseInFlightRef.current = false
      isFirstResponseRef.current = true
      micSuppressedForGreetingRef.current = true
      setTranscript([])
      connect(onboarding)
    },
    [connect],
  )

  const setMuted = useCallback(
    (next) => {
      setMutedState(next)
      micMutedByUserRef.current = next
      syncMicTrackEnabled()
    },
    [syncMicTrackEnabled],
  )

  const setSpeakerBoost = useCallback(
    (next) => {
      setSpeakerBoostState(next)
      applyAudioRoute(next)
    },
    [applyAudioRoute],
  )

  return {
    status,
    errorMessage,
    errorKind,
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
