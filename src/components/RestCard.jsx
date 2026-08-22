import { useEffect, useRef, useState } from 'react'

function formatMMSS(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

function playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch {
    // Web Audio unavailable; skip the beep
  }
}

export default function RestCard({ entry, onStart, onFinish, onCancelTimer, onEdit, onDelete }) {
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

  return (
    <div className="entry-card rest-card">
      <div className="entry-card__header">
        <span className="entry-card__name">Rest</span>
        {entry.status === 'planned' && !running && <span className="badge">planned</span>}
      </div>

      {entry.status === 'completed' ? (
        <p className="rest-card__result">Rested {formatMMSS(entry.actualSeconds ?? entry.targetSeconds)}</p>
      ) : running ? (
        <p className={`rest-card__timer ${overtime ? 'rest-card__timer--over' : ''}`}>
          {overtime ? '+' : ''}
          {formatMMSS(Math.abs(remaining))}
        </p>
      ) : (
        <p className="rest-card__target">{formatMMSS(entry.targetSeconds)}</p>
      )}

      <div className="entry-card__actions">
        {running && onFinish && onCancelTimer ? (
          <>
            <button type="button" className="btn btn--primary" onClick={() => onFinish(entry, Math.round(elapsed))}>
              Done
            </button>
            <button type="button" className="btn btn--link" onClick={() => onCancelTimer(entry)}>
              Cancel
            </button>
          </>
        ) : (
          <>
            {entry.status === 'planned' && !running && onStart && (
              <button type="button" className="btn btn--primary" onClick={() => onStart(entry)}>
                Start
              </button>
            )}
            <button type="button" className="btn btn--secondary" onClick={() => onEdit(entry)}>
              Edit
            </button>
            <button type="button" className="btn btn--danger" onClick={() => onDelete(entry)}>
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  )
}
