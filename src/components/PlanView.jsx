import { useState } from 'react'
import ExerciseForm from './ExerciseForm'
import RestForm from './RestForm'
import CardioForm from './CardioForm'
import EntryCard from './EntryCard'
import RestCard from './RestCard'
import CardioCard from './CardioCard'
import DayTheme from './DayTheme'
import CopyDay from './CopyDay'
import ExercisePicker from './ExercisePicker'
import { draftFromName } from '../lib/draft'
import { defaultsFor } from '../lib/exerciseDb'

const CARD_BY_TYPE = { rest: RestCard, cardio: CardioCard }

export default function PlanView({
  entries,
  initialDate,
  catalog,
  custom,
  onAddCustom,
  cardioCatalog,
  onAddExercise,
  onAddRest,
  onAddCardio,
  onAddMany,
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
  const [browsing, setBrowsing] = useState(false)

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

  function handleAddPicked(names) {
    const drafts = names.map((name) => {
      const d = draftFromName(name, entries, defaultsFor(name, custom) ?? {})
      return {
        type: 'strength',
        date: sessionDate,
        status: 'planned',
        exerciseName: d.exerciseName,
        bodyweight: d.bodyweight,
        timed: d.timed,
        timeUnit: d.timeUnit,
        enableBeeps: d.enableBeeps,
        notes: '',
        sets: d.sets,
      }
    })
    onAddMany(drafts)
    setBrowsing(false)
  }

  function handleCopy(drafts, fromDate) {
    onAddMany(drafts)
    // Bring the theme along when the target day doesn't have one yet.
    if (!themes[sessionDate] && themes[fromDate]) onSaveTheme(sessionDate, themes[fromDate])
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
        <ExerciseForm
          mode="plan"
          date={sessionDate}
          entries={entries}
          catalog={catalog}
          custom={custom}
          onAddCustom={onAddCustom}
          onSave={handleSave}
          onCancel={() => setAdding(false)}
        />
      ) : browsing ? (
        <ExercisePicker
          theme={themes[sessionDate] ?? ''}
          catalog={catalog}
          custom={custom}
          onAdd={handleAddPicked}
          onAddCustom={onAddCustom}
          onClose={() => setBrowsing(false)}
        />
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
          <button type="button" className="btn btn--secondary btn--full" onClick={() => setBrowsing(true)}>
            Browse exercises{themes[sessionDate] ? ` for ${themes[sessionDate]}` : ''}
          </button>
          <button type="button" className="btn btn--secondary btn--full" onClick={() => setAddingRest(true)}>
            + Add rest
          </button>
          <button type="button" className="btn btn--secondary btn--full" onClick={() => setAddingCardio(true)}>
            + Add cardio
          </button>
          <CopyDay entries={entries} themes={themes} targetDate={sessionDate} onCopy={handleCopy} />
        </div>
      )}

      <button type="button" className="btn btn--secondary btn--full plan-view__done" onClick={onDone}>
        Done planning
      </button>
    </div>
  )
}
