import { useState } from 'react'
import ExerciseForm from './ExerciseForm'
import EntryCard from './EntryCard'

export default function PlanView({ entries, today, catalog, onAddExercise, onEdit, onDelete, onDone }) {
  const [sessionDate, setSessionDate] = useState(today)
  const [adding, setAdding] = useState(false)

  const plannedForSession = entries.filter((e) => e.date === sessionDate && e.status === 'planned')

  function handleSave(entryData) {
    onAddExercise(entryData)
    setAdding(false)
  }

  return (
    <div className="plan-view">
      <button type="button" className="btn btn--link" onClick={onDone}>
        ← Back
      </button>

      <h1 className="page-title">Plan session</h1>

      <label className="field">
        <span className="field__label">Date</span>
        <input className="input" type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
      </label>

      {plannedForSession.map((entry) => (
        <EntryCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
      ))}

      {adding ? (
        <ExerciseForm mode="plan" date={sessionDate} catalog={catalog} onSave={handleSave} onCancel={() => setAdding(false)} />
      ) : (
        <button type="button" className="btn btn--primary btn--full" onClick={() => setAdding(true)}>
          + Add exercise
        </button>
      )}

      <button type="button" className="btn btn--secondary btn--full" onClick={onDone}>
        Done planning
      </button>
    </div>
  )
}
