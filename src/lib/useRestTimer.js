import { useEffect, useRef, useState } from 'react'
import { playBeep } from './audio'

// Live state for a rest entry. The start time is persisted on the entry, so
// this just derives elapsed/remaining from it on a 250ms tick, and beeps once
// when the target is reached. It counts on into overtime rather than stopping.
export function useRestTimer(entry) {
  const [now, setNow] = useState(Date.now())
  const running = entry.status === 'planned' && entry.startedAt != null
  const beepedRef = useRef(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [running])

  const elapsed = running ? (now - entry.startedAt) / 1000 : 0
  const remaining = entry.targetSeconds - elapsed
  const overtime = remaining < 0

  useEffect(() => {
    if (running && overtime && !beepedRef.current) {
      beepedRef.current = true
      playBeep()
    }
    if (!running) beepedRef.current = false
  }, [running, overtime])

  return { running, elapsed, remaining, overtime }
}
