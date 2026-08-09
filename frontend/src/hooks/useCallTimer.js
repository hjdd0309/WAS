import { useEffect, useRef, useState } from 'react'

export default function useCallTimer(active = true) {
  const [seconds, setSeconds] = useState(0)
  const startRef = useRef(null)

  useEffect(() => {
    if (!active) return

    startRef.current = Date.now() - seconds * 1000
    const tick = () => setSeconds(Math.floor((Date.now() - startRef.current) / 1000))

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [active])

  return seconds
}

export function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
