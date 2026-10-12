import { useState } from 'react'
import Autocomplete from './Autocomplete'
import SetRow from './SetRow'
import { DEFAULT_HOLD_SECONDS, draftFromName, emptySet, lastTimeFor } from '../lib/draft'

function formatDate(dateISO) {
  const [y, m, d] = dateISO.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Last session's targets, moved over to the actual columns for logging.
function asActuals(set) {
  return {
    ...set,
    actualWeight: set.targetWeight,
    actualReps: set.targetReps,
    actualSeconds: set.targetSeconds,
    targetWeight: null,
    targetReps: null,
    targetSeconds: null,
  }
}

export default function ExerciseForm({ mode, date, entry, entries = [], catalog, onSave, onCancel }) {
  const editingPlanned = mode === 'edit' && entry?.status === 'planned'
  const usesTargetInputs = mode === 'plan' || editingPlanned
  const usesActualInputs = mode === 'log' || (mode === 'edit' && !editingPlanned)

  const [exerciseName, setExerciseName] = useState(entry?.exerciseName ?? '')
  const [entryDate, setEntryDate] = useState(entry?.date ?? date)
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [bodyweight, setBodyweight] = useState(entry?.bodyweight ?? false)
  const [timed, setTimed] = useState(entry?.timed ?? false)
  const [timeUnit, setTimeUnit] = useState(entry?.timeUnit ?? 'seconds')
  const [enableBeeps, setEnableBeeps] = useState(entry?.enableBeeps ?? true)
  const [sets, setSets] = useState(entry?.sets?.length ? entry.sets : [emptySet()])
  // Last-time prefill only ever fills an untouched form, so it can't clobber
  // anything the user has typed.
  const [pristine, setPristine] = useState(true)
  const [filledFrom, setFilledFrom] = useState(null)

  function handleNameChange(name) {
    setExerciseName(name)
    if (mode === 'edit' || !pristine || !lastTimeFor(name, entries)) return
    const draft = draftFromName(name, entries)
    setBodyweight(draft.bodyweight)
    setTimed(draft.timed)
    setTimeUnit(draft.timeUnit)
    setEnableBeeps(draft.enableBeeps)
    setSets(mode === 'log' ? draft.sets.map(asActuals) : draft.sets)
    setFilledFrom(draft.fromDate)
  }

  function updateSet(i, patch) {
    setPristine(false)
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }

  function toggleBodyweight(checked) {
    setPristine(false)
    setBodyweight(checked)
    if (checked) {
      setSets((prev) => prev.map((s) => ({ ...s, targetWeight: null, actualWeight: null })))
    }
  }

  function toggleTimed(checked) {
    setPristine(false)
    setTimed(checked)
    if (checked) {
      setSets((prev) => prev.map((s) => ({ ...s, targetSeconds: s.targetSeconds ?? DEFAULT_HOLD_SECONDS })))
    }
  }

  function addSet() {
    setPristine(false)
    setSets((prev) => {
      const base = prev.length ? { ...prev[prev.length - 1] } : emptySet()
      if (timed) base.targetSeconds = base.targetSeconds ?? DEFAULT_HOLD_SECONDS
      return [...prev, base]
    })
  }

  function removeSet(i) {
    setPristine(false)
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
      timeUnit,
      enableBeeps,
      sets: cleanedSets,
      status: mode === 'log' ? 'completed' : entry?.status ?? 'planned',
    })
  }

  return (
    <form className="exercise-form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field__label">Exercise</span>
        <Autocomplete
          value={exerciseName}
          onChange={handleNameChange}
          catalog={catalog}
          placeholder="Exercise name"
          required
        />
      </label>
      {filledFrom && <p className="exercise-form__hint">Filled in from {formatDate(filledFrom)} — change anything.</p>}

      <label className="field field--checkbox">
        <input type="checkbox" checked={bodyweight} onChange={(e) => toggleBodyweight(e.target.checked)} />
        <span>Bodyweight, no weight</span>
      </label>

      <label className="field field--checkbox">
        <input type="checkbox" checked={timed} onChange={(e) => toggleTimed(e.target.checked)} />
        <span>Timed hold (plank, hang…)</span>
      </label>

      {timed && (
        <>
          <label className="field">
            <span className="field__label">Time unit</span>
            <select className="input" value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)}>
              <option value="seconds">Seconds</option>
              <option value="minutes">Minutes</option>
            </select>
          </label>

          <label className="field field--checkbox">
            <input type="checkbox" checked={enableBeeps} onChange={(e) => setEnableBeeps(e.target.checked)} />
            <span>Audio countdown beeps</span>
          </label>
        </>
      )}

      {mode !== 'plan' && (
        <label className="field">
          <span className="field__label">Date</span>
          <input className="input" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
        </label>
      )}

      <div className="field">
        <span className="field__label">{timed ? `Sets — hold time in ${timeUnit}` : 'Sets'}</span>
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
              timeUnit={timeUnit}
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
