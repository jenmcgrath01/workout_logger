import { useState } from 'react'
import SetRow from './SetRow'

export default function LogExerciseView({ entry, onPersist, onComplete, onBack }) {
  const [sets, setSets] = useState(
    entry.sets.map((s) => ({
      ...s,
      actualWeight: s.actualWeight ?? s.targetWeight ?? null,
      actualReps: s.actualReps ?? s.targetReps ?? null,
    }))
  )
  const [notes, setNotes] = useState(entry.notes ?? '')

  function updateSet(i, patch) {
    const next = sets.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    setSets(next)
    onPersist({ sets: next, notes })
  }

  function updateNotes(value) {
    setNotes(value)
    onPersist({ sets, notes: value })
  }

  return (
    <div className="log-view">
      <button type="button" className="btn btn--link" onClick={onBack}>
        ← Back
      </button>

      <h2 className="log-view__title">{entry.exerciseName}</h2>

      <div className="set-list">
        {sets.map((s, i) => (
          <SetRow key={i} index={i} set={s} showTargetInputs={false} showActualInputs onChange={(patch) => updateSet(i, patch)} />
        ))}
      </div>

      <label className="field">
        <span className="field__label">Notes</span>
        <textarea className="input" rows={2} value={notes} onChange={(e) => updateNotes(e.target.value)} placeholder="Optional" />
      </label>

      <button type="button" className="btn btn--primary btn--full" onClick={() => onComplete({ sets, notes })}>
        Mark complete
      </button>
    </div>
  )
}
