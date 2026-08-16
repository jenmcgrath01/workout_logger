import { useState } from 'react'
import ExerciseAutocomplete from './ExerciseAutocomplete'
import SetRow from './SetRow'

function emptySet() {
  return { targetWeight: null, targetReps: null, actualWeight: null, actualReps: null }
}

export default function ExerciseForm({ mode, date, entry, catalog, onSave, onCancel }) {
  const editingPlanned = mode === 'edit' && entry?.status === 'planned'
  const usesTargetInputs = mode === 'plan' || editingPlanned
  const usesActualInputs = mode === 'log' || (mode === 'edit' && !editingPlanned)

  const [exerciseName, setExerciseName] = useState(entry?.exerciseName ?? '')
  const [entryDate, setEntryDate] = useState(entry?.date ?? date)
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [sets, setSets] = useState(entry?.sets?.length ? entry.sets : [emptySet()])

  function updateSet(i, patch) {
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }

  function addSet() {
    setSets((prev) => [...prev, prev.length ? { ...prev[prev.length - 1] } : emptySet()])
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
      actualWeight: s.actualWeight ?? null,
      actualReps: s.actualReps ?? null,
    }))

    onSave({
      exerciseName: exerciseName.trim(),
      date: mode === 'plan' ? date : entryDate,
      notes,
      sets: cleanedSets,
      status: mode === 'log' ? 'completed' : entry?.status ?? 'planned',
    })
  }

  return (
    <form className="exercise-form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field__label">Exercise</span>
        <ExerciseAutocomplete value={exerciseName} onChange={setExerciseName} catalog={catalog} listId="exercise-catalog" />
      </label>

      {mode !== 'plan' && (
        <label className="field">
          <span className="field__label">Date</span>
          <input className="input" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
        </label>
      )}

      <div className="field">
        <span className="field__label">Sets</span>
        <div className="set-list">
          {sets.map((s, i) => (
            <SetRow
              key={i}
              index={i}
              set={s}
              showTargetInputs={usesTargetInputs}
              showActualInputs={usesActualInputs}
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
