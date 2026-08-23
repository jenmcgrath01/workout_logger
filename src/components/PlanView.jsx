import { useState } from 'react'
import ExerciseForm from './ExerciseForm'
import RestForm from './RestForm'
import CardioForm from './CardioForm'
import EntryCard from './EntryCard'
import RestCard from './RestCard'
import CardioCard from './CardioCard'
import DayTheme from './DayTheme'

const CARD_BY_TYPE = { rest: RestCard, cardio: CardioCard }

export default function PlanView({
  entries,
  initialDate,
  catalog,
  cardioCatalog,
  onAddExercise,
  onAddRest,
  onAddCardio,
  onEdit,
  onDelete,
  onSwap,
  themes,
  themeCatalog,
  onSaveTheme,
  onDone,
}) {
  const [sessionDate, setSessionDate] = useState(initialDate)
  const [adding, setAdding] = useState(false)
  const [addingRest, setAddingRest] = useState(false)
  const [addingCardio, setAddingCardio] = useState(false)

  const plannedForSession = entries.filter((e) => e.date === sessionDate && e.status === 'planned')

  function handleSave(entryData) {
    onAddExercise(entryData)
    setAdding(false)
  }

  function handleSaveRest(entryData) {
    onAddRest({ ...entryData, date: sessionDate })
    setAddingRest(false)
  }

  function handleSaveCardio(entryData) {
    onAddCardio(entryData)
    setAddingCardio(false)
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

      <div className="field">
        <span className="field__label">Theme</span>
        <DayTheme date={sessionDate} theme={themes[sessionDate] ?? ''} catalog={themeCatalog} onSave={onSaveTheme} />
      </div>

      {plannedForSession.map((entry, i) => {
        const reorder = {
          onMoveUp: i > 0 ? () => onSwap(entry.id, plannedForSession[i - 1].id) : undefined,
          onMoveDown: i < plannedForSession.length - 1 ? () => onSwap(entry.id, plannedForSession[i + 1].id) : undefined,
        }
        const Card = CARD_BY_TYPE[entry.type] ?? EntryCard
        return <Card key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} {...reorder} />
      })}

      {adding ? (
        <ExerciseForm mode="plan" date={sessionDate} catalog={catalog} onSave={handleSave} onCancel={() => setAdding(false)} />
      ) : addingRest ? (
        <RestForm onSave={handleSaveRest} onCancel={() => setAddingRest(false)} />
      ) : addingCardio ? (
        <CardioForm
          mode="plan"
          date={sessionDate}
          catalog={cardioCatalog}
          onSave={handleSaveCardio}
          onCancel={() => setAddingCardio(false)}
        />
      ) : (
        <div className="plan-view__add-actions">
          <button type="button" className="btn btn--primary btn--full" onClick={() => setAdding(true)}>
            + Add exercise
          </button>
          <button type="button" className="btn btn--secondary btn--full" onClick={() => setAddingRest(true)}>
            + Add rest
          </button>
          <button type="button" className="btn btn--secondary btn--full" onClick={() => setAddingCardio(true)}>
            + Add cardio
          </button>
        </div>
      )}

      <button type="button" className="btn btn--secondary btn--full plan-view__done" onClick={onDone}>
        Done planning
      </button>
    </div>
  )
}
