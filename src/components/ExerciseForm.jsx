import { useState } from 'react'
import ExerciseAutocomplete from './ExerciseAutocomplete'
import SetRow from './SetRow'

const DEFAULT_HOLD_SECONDS = 30

function emptySet() {
  return {
    targetWeight: null,
    targetReps: null,
    targetSeconds: null,
    actualWeight: null,
    actualReps: null,
    actualSeconds: null,
  }
}

export default function ExerciseForm({ mode, date, entry, catalog, onSave, onCancel }) {
  const editingPlanned = mode === 'edit' && entry?.status === 'planned'
  const usesTargetInputs = mode === 'plan' || editingPlanned
  const usesActualInputs = mode === 'log' || (mode === 'edit' && !editingPlanned)

  const [exerciseName, setExerciseName] = useState(entry?.exerciseName ?? '')
  const [entryDate, setEntryDate] = useState(entry?.date ?? date)
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [bodyweight, setBodyweight] = useState(entry?.bodyweight ?? false)
  const [timed, setTimed] = useState(entry?.timed ?? false)
  const [sets, setSets] = useState(entry?.sets?.length ? entry.sets : [emptySet()])

  function updateSet(i, patch) {
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }

  function toggleBodyweight(checked) {
    setBodyweight(checked)
    if (checked) {
      setSets((prev) => prev.map((s) => ({ ...s, targetWeight: null, actualWeight: null })))
    }
  }

  function toggleTimed(checked) {
    setTimed(checked)
    if (checked) {
      setSets((prev) => prev.map((s) => ({ ...s, targetSeconds: s.targetSeconds ?? DEFAULT_HOLD_SECONDS })))
    }
  }

  function addSet() {
    setSets((prev) => {
      const base = prev.length ? { ...prev[prev.length - 1] } : emptySet()
      if (timed) base.targetSeconds = base.targetSeconds ?? DEFAULT_HOLD_SECONDS
      return [...prev, base]
    })
  }

  function removeSet(i) {
    setSets((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!exerciseName.trim()) return

    const cleanedSets = sets.map((s) => ({
      targetWeight: s.targetWeight ?? null,
      targetReps: s.targetReps ?? null,
      targetSeconds: s.targetSeconds ?? null,
      actualWeight: s.actualWeight ?? null,
      actualReps: s.actualReps ?? null,
      actualSeconds: s.actualSeconds ?? null,
    }))

    onSave({
      exerciseName: exerciseName.trim(),
      date: mode === 'plan' ? date : entryDate,
      notes,
      bodyweight,
      timed,
      sets: cleanedSets,
      status: mode === 'log' ? 'completed' : entry?.status ?? 'planned',
    })
  }

  return (
    <form className="exercise-form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field__label">Exercise</span>
        <ExerciseAutocomplete value={exerciseName} onChange={setExerciseName} catalog={catalog} />
      </label>

      <label className="field field--checkbox">
        <input type="checkbox" checked={bodyweight} onChange={(e) => toggleBodyweight(e.target.checked)} />
        <span>Bodyweight, no weight</span>
      </label>

      <label className="field field--checkbox">
        <input type="checkbox" checked={timed} onChange={(e) => toggleTimed(e.target.checked)} />
        <span>Timed hold (plank, hang…)</span>
      </label>

      {mode !== 'plan' && (
        <label className="field">
          <span className="field__label">Date</span>
          <input className="input" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
        </label>
      )}

      <div className="field">
        <span className="field__label">{timed ? 'Sets — hold time in seconds' : 'Sets'}</span>
        <div className="set-list">
          {sets.map((s, i) => (
            <SetRow
              key={i}
              index={i}
              set={s}
              showTargetInputs={usesTargetInputs}
              showActualInputs={usesActualInputs}
              showWeight={!bodyweight}
              timed={timed}
              onChange={(patch) => updateSet(i, patch)}
              onRemove={sets.length > 1 ? () => removeSet(i) : undefined}
            />
          ))}
        </div>
        <button type="button" className="btn btn--secondary btn--full" onClick={addSet}>
          + Add set
        </button>
      </div>

      <label className="field">
        <span className="field__label">Notes</span>
        <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
      </label>

      <div className="form-actions">
        <button type="button" className="btn btn--secondary btn--full" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary btn--full">
          {mode === 'plan' ? 'Add to plan' : mode === 'log' ? 'Log exercise' : 'Save'}
        </button>
      </div>
    </form>
  )
}
