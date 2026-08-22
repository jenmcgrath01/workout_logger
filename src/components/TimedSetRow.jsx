import { useEffect, useRef, useState } from 'react'
import { formatMMSS } from '../lib/format'
import { scheduleHoldBeeps, unlockAudio } from '../lib/audio'

const LEAD_IN = 5

export default function TimedSetRow({ index, set, onChange }) {
  const target = set.targetSeconds ?? 0
  const [startedAt, setStartedAt] = useState(null)
  const [now, setNow] = useState(Date.now())
  const cancelBeepsRef = useRef(null)
  const recordedRef = useRef(false)

  const running = startedAt != null
  const elapsed = running ? (now - startedAt) / 1000 : 0
  const inLeadIn = running && elapsed < LEAD_IN
  const held = Math.max(0, elapsed - LEAD_IN)
  const remaining = target - held
  const finished = running && target > 0 && remaining <= 0

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [running])

  // Auto-record and stop once the hold reaches its target.
  useEffect(() => {
    if (finished && !recordedRef.current) {
      recordedRef.current = true
      onChange({ actualSeconds: target })
      setStartedAt(null)
    }
  }, [finished, target, onChange])

  useEffect(() => () => cancelBeepsRef.current?.(), [])

  function start() {
    if (!target) return
    unlockAudio()
    recordedRef.current = false
    cancelBeepsRef.current?.()
    cancelBeepsRef.current = scheduleHoldBeeps({ leadInSeconds: LEAD_IN, holdSeconds: target })
    setNow(Date.now())
    setStartedAt(Date.now())
  }

  function stopEarly() {
    cancelBeepsRef.current?.()
    cancelBeepsRef.current = null
    if (!inLeadIn) onChange({ actualSeconds: Math.round(held) })
    setStartedAt(null)
  }

  return (
    <div className={`timed-set ${running ? 'is-running' : ''}`}>
      <div className="timed-set__top">
        <span className="set-row__num">{index + 1}</span>
        <span className="timed-set__target">target {formatMMSS(target)}</span>

        <label className="timed-set__actual">
          <input
            className="input input--num"
            type="number"
            inputMode="numeric"
            placeholder="secs"
            value={set.actualSeconds ?? ''}
            onChange={(e) => onChange({ actualSeconds: e.target.value === '' ? null : Number(e.target.value) })}
          />
          <span className="set-row__unit">sec</span>
        </label>
      </div>

      {running && (
        <p className={`timed-set__clock ${inLeadIn ? 'timed-set__clock--lead' : ''}`}>
          {inLeadIn ? Math.ceil(LEAD_IN - elapsed) : formatMMSS(remaining)}
          {inLeadIn && <span className="timed-set__ready"> get ready</span>}
        </p>
      )}

      <button
        type="button"
        className={`btn btn--full ${running ? 'btn--danger' : 'btn--secondary'}`}
        onClick={running ? stopEarly : start}
        disabled={!target}
      >
        {running ? 'Stop' : set.actualSeconds != null ? 'Redo' : 'Start'}
      </button>
    </div>
  )
}
