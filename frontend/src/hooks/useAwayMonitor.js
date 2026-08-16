import { useEffect, useRef, useState } from 'react'
import { showCallNotification } from '../lib/notify'
import { postJson } from '../lib/api'

const LEFT_AT_KEY = 'was:leftAt'
const NOTIFIED_KEY = 'was:leftNotified'
const POLL_MS = 20_000

/**
 * "다른 앱을 얼마나 썼는지"는 웹에서 알 방법이 없으니(OS 권한 필요),
 * 대신 "이 앱을 벗어나 있던 시간"을 근사치로 쓴다.
 *
 * 신뢰할 수 있는 경로: 앱으로 돌아왔을 때 나갔던 시각(localStorage)과
 * 지금을 비교해서 임계값을 넘었으면 바로 전화 화면을 띄운다 — 페이지가
 * 다시 로드된 시점에 실행되는 코드라 백그라운드 실행 여부와 무관하게 항상 동작한다.
 *
 * best-effort 경로: 벗어나 있는 동안 주기적으로 서버에 실제 Push 발송을
 * 요청한다(/api/push/send, 실제 알림 표시는 sw.js의 push 이벤트에서 일어남).
 * 서버/네트워크 문제로 실패하면 로컬 알림(lib/notify.js)으로 폴백한다.
 * 다만 브라우저(특히 iOS)가 백그라운드 탭의 JS를 일찍 정지시킬 수 있어서
 * 이 알림이 항상 온다는 보장은 없다.
 */
export default function useAwayMonitor({ enabled, limitMinutes, personaName, onThresholdReached }) {
  const [awaySeconds, setAwaySeconds] = useState(0)
  const pollRef = useRef(null)
  const onThresholdReachedRef = useRef(onThresholdReached)
  onThresholdReachedRef.current = onThresholdReached

  useEffect(() => {
    if (!enabled) return undefined

    const thresholdMs = limitMinutes * 60 * 1000

    const clearPoll = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }

    const startPoll = () => {
      clearPoll()
      pollRef.current = setInterval(async () => {
        const leftAt = Number(localStorage.getItem(LEFT_AT_KEY))
        if (!leftAt) return
        const elapsed = Date.now() - leftAt
        if (elapsed >= thresholdMs && !localStorage.getItem(NOTIFIED_KEY)) {
          const pushed = await postJson('/api/push/send', {})
          const sent = pushed?.ok || (await showCallNotification(personaName))
          if (sent) localStorage.setItem(NOTIFIED_KEY, '1')
        }
      }, POLL_MS)
    }

    // 앱을 벗어난 채로 완전히 종료했다가 나중에 다시 켠 경우도 여기서 잡힌다.
    const checkReturn = () => {
      const leftAt = Number(localStorage.getItem(LEFT_AT_KEY))
      if (!leftAt) return
      const elapsed = Date.now() - leftAt
      setAwaySeconds(Math.floor(elapsed / 1000))
      localStorage.removeItem(LEFT_AT_KEY)
      localStorage.removeItem(NOTIFIED_KEY)
      clearPoll()
      if (elapsed >= thresholdMs) {
        onThresholdReachedRef.current?.()
      }
    }

    const handleVisibility = () => {
      if (document.hidden) {
        localStorage.setItem(LEFT_AT_KEY, String(Date.now()))
        startPoll()
      } else {
        checkReturn()
      }
    }

    checkReturn()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      clearPoll()
    }
  }, [enabled, limitMinutes, personaName])

  return { awaySeconds }
}
