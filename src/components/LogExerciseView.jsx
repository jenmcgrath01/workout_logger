import { useState } from 'react'
import SetRow from './SetRow'
import TimedSetRow from './TimedSetRow'

// `hideBack`, `done` and `doneAction` let the workout runner embed this view:
// it supplies its own header, and swaps "Mark complete" for its "Next" button
// once the exercise is logged.
export default function LogExerciseView({ entry, onPersist, onComplete, onBack, hideBack = false, done = false, doneAction = null }) {
  const [sets, setSets] = useState(
    entry.sets.map((s) => ({
      ...s,
      actualWeight: s.actualWeight ?? s.targetWeight ?? null,
      // A timed hold's actual comes from the timer, so it is not pre-filled.
      actualReps: entry.timed ? s.actualReps ?? null : s.actualReps ?? s.targetReps ?? null,
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
      {!hideBack && (
        <button type="button" className="btn btn--link" onClick={onBack}>
          ← Back
        </button>
      )}

      <h2 className="log-view__title">{entry.exerciseName}</h2>

      <div className="set-list">
        {sets.map((s, i) =>
          entry.timed ? (
            <TimedSetRow
              key={i}
              index={i}
              set={s}
              timeUnit={entry.timeUnit ?? 'seconds'}
              enableBeeps={entry.enableBeeps ?? true}
              onChange={(patch) => updateSet(i, patch)}
            />
          ) : (
            <SetRow
              key={i}
              index={i}
              set={s}
              showTargetInputs={false}
              showActualInputs
              showWeight={!entry.bodyweight}
              onChange={(patch) => updateSet(i, patch)}
            />
          )
        )}
      </div>

      <label className="field">
        <span className="field__label">Notes</span>
        <textarea className="input" rows={2} value={notes} onChange={(e) => updateNotes(e.target.value)} placeholder="Optional" />
      </label>

      {done ? (
        doneAction
      ) : (
        <button type="button" className="btn btn--primary btn--full" onClick={() => onComplete({ sets, notes })}>
          Mark complete
        </button>
      )}
    </div>
  )
}
