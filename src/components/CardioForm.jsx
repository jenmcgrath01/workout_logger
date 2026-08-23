import { useState } from 'react'
import Autocomplete from './Autocomplete'
import { formatMinutes } from '../lib/format'

// Cardio has no sets, so target/actual apply to the whole entry rather than
// per-row like strength — editingPlanned/mode make these mutually exclusive,
// same split ExerciseForm uses.
export default function CardioForm({ mode, date, entry, catalog, onSave, onCancel }) {
  const editingPlanned = mode === 'edit' && entry?.status === 'planned'
  const usesTargetInputs = mode === 'plan' || editingPlanned
  const usesActualInputs = mode === 'log' || (mode === 'edit' && !editingPlanned)

  const [name, setName] = useState(entry?.exerciseName ?? '')
  const [entryDate, setEntryDate] = useState(entry?.date ?? date)
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [minutes, setMinutes] = useState(
    usesActualInputs ? entry?.actualMinutes ?? entry?.targetMinutes ?? '' : entry?.targetMinutes ?? ''
  )
  const [miles, setMiles] = useState(
    usesActualInputs ? entry?.actualMiles ?? entry?.targetMiles ?? '' : entry?.targetMiles ?? ''
  )

  const hasTarget = entry && (entry.targetMinutes != null || entry.targetMiles != null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return

    const minutesNum = minutes === '' ? null : Number(minutes)
    const milesNum = miles === '' ? null : Number(miles)

    onSave({
      exerciseName: name.trim(),
      date: mode === 'plan' ? date : entryDate,
      notes,
      targetMinutes: usesTargetInputs ? minutesNum : entry?.targetMinutes ?? null,
      targetMiles: usesTargetInputs ? milesNum : entry?.targetMiles ?? null,
      actualMinutes: usesActualInputs ? minutesNum : entry?.actualMinutes ?? null,
      actualMiles: usesActualInputs ? milesNum : entry?.actualMiles ?? null,
      status: mode === 'log' ? 'completed' : entry?.status ?? 'planned',
    })
  }

  return (
    <form className="cardio-form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field__label">Activity</span>
        <Autocomplete value={name} onChange={setName} catalog={catalog} placeholder="Run, bike, row…" required />
      </label>

      {mode !== 'plan' && (
        <label className="field">
          <span className="field__label">Date</span>
          <input className="input" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
        </label>
      )}

      {usesActualInputs && hasTarget && (
        <p className="cardio-form__target">
          target {entry.targetMinutes != null ? formatMinutes(entry.targetMinutes) : '–'}
          {entry.targetMiles != null ? ` · ${entry.targetMiles} mi` : ''}
        </p>
      )}

      <div className="cardio-form__row">
        <label className="field">
          <span className="field__label">{usesTargetInputs ? 'Target minutes' : 'Minutes'}</span>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            placeholder="90"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">{usesTargetInputs ? 'Target miles' : 'Miles'}</span>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="optional"
            value={miles}
            onChange={(e) => setMiles(e.target.value)}
          />
        </label>
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
          {mode === 'plan' ? 'Add to plan' : mode === 'log' ? 'Log cardio' : 'Save'}
        </button>
      </div>
    </form>
  )
}
