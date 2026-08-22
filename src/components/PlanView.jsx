import { useState } from 'react'
import ExerciseForm from './ExerciseForm'
import RestForm from './RestForm'
import EntryCard from './EntryCard'
import RestCard from './RestCard'

export default function PlanView({ entries, initialDate, catalog, onAddExercise, onAddRest, onEdit, onDelete, onDone }) {
  const [sessionDate, setSessionDate] = useState(initialDate)
  const [adding, setAdding] = useState(false)
  const [addingRest, setAddingRest] = useState(false)

  const plannedForSession = entries.filter((e) => e.date === sessionDate && e.status === 'planned')

  function handleSave(entryData) {
    onAddExercise(entryData)
    setAdding(false)
  }

  function handleSaveRest(entryData) {
    onAddRest({ ...entryData, date: sessionDate })
    setAddingRest(false)
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

      {plannedForSession.map((entry) =>
        entry.type === 'rest' ? (
          <RestCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
        ) : (
          <EntryCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
        )
      )}

      {adding ? (
        <ExerciseForm mode="plan" date={sessionDate} catalog={catalog} onSave={handleSave} onCancel={() => setAdding(false)} />
      ) : addingRest ? (
        <RestForm onSave={handleSaveRest} onCancel={() => setAddingRest(false)} />
      ) : (
        <div className="plan-view__add-actions">
          <button type="button" className="btn btn--primary btn--full" onClick={() => setAdding(true)}>
            + Add exercise
          </button>
          <button type="button" className="btn btn--secondary btn--full" onClick={() => setAddingRest(true)}>
            + Add rest
          </button>
        </div>
      )}

      <button type="button" className="btn btn--secondary btn--full plan-view__done" onClick={onDone}>
        Done planning
      </button>
    </div>
  )
}
