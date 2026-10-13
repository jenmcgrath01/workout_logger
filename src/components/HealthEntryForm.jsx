import { useState } from 'react'
import { addDaysISO, DOSE_PRESETS } from '../lib/health'
import { relativeDay } from '../lib/chart'
import { fmtDate } from '../lib/useChartHover'

const TITLES = { weight: 'Log weight', dose: 'Log dose', event: 'Add event' }
const EVENT_IDEAS = ['Trip', 'Sick', 'Holiday', 'Missed dose']

// Logs a weigh-in, a dose, or an event on any date, past or future. For the
// two things you repeat ("Save and add next") the date moves on by itself, so a
// year of weekly doses is one tap each.
export default function HealthEntryForm({ kind, initial = {}, health, today, onSave, onClose }) {
  const lastDose = [...health.doses].sort((a, b) => (a.date < b.date ? -1 : 1)).pop()
  const [date, setDate] = useState(initial.date ?? today)
  const [weight, setWeight] = useState(initial.weight != null ? String(initial.weight) : '')
  const [mg, setMg] = useState(initial.mg ?? lastDose?.mg ?? null)
  const [mgText, setMgText] = useState('')
  const [label, setLabel] = useState(initial.label ?? '')
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')

  const step = kind === 'dose' ? 7 : 1
  const nextDate = addDaysISO(date, step)
  const canAddNext = kind !== 'event' && nextDate <= today
  const doseValue = mgText !== '' ? Number(mgText) : mg

  // Context so a backfilled entry can be sanity-checked.
  const earlierDoses = health.doses.filter((d) => d.date <= date).slice(-2)
  const existingWeight = health.weights.find((w) => w.date === date)

  function fail(message) {
    setError(message)
    return null
  }

  function collect() {
    if (!date) return fail('Pick a date.')
    if (kind === 'weight') {
      const w = Number(weight)
      if (!weight || !(w > 0) || w > 1000) return fail('Enter your weight in pounds.')
      return { kind, date, weight: w }
    }
    if (kind === 'dose') {
      if (!(doseValue > 0) || doseValue > 100) return fail('Pick or enter a dose in mg.')
      return { kind, date, mg: doseValue }
    }
    if (!label.trim()) return fail('Give the event a short name.')
    return { kind, date, label: label.trim() }
  }

  function save(andNext) {
    const values = collect()
    if (!values) return
    onSave(values)
    if (andNext) {
      setError('')
      setFlash(`Saved ${fmtDate(date)}`)
      setDate(nextDate)
      if (kind === 'weight') setWeight('')
    } else {
      onClose()
    }
  }

  return (
    <div className="health-form">
      <h2 className="picker__title">{TITLES[kind]}</h2>

      <label className="field">
        <span className="field__label">Date</span>
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setFlash('')
            setError('')
          }}
        />
        {date && <span className="health-form__hint">{relativeDay(date, today)}</span>}
      </label>

      {kind === 'weight' && (
        <label className="field">
          <span className="field__label">Weight (lb)</span>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="182.4"
            value={weight}
            autoFocus
            onChange={(e) => {
              setWeight(e.target.value)
              setError('')
            }}
          />
          {existingWeight && existingWeight.weight !== Number(weight) && (
            <span className="health-form__hint">Replaces {existingWeight.weight} lb logged on this day.</span>
          )}
        </label>
      )}

      {kind === 'dose' && (
        <>
          <div className="field">
            <span className="field__label">Dose (mg)</span>
            <div className="chips">
              {DOSE_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`chip ${mgText === '' && mg === p ? 'is-selected' : ''}`}
                  onClick={() => {
                    setMg(p)
                    setMgText('')
                    setError('')
                  }}
                >
                  {p} mg
                </button>
              ))}
            </div>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              step="0.05"
              placeholder="Or type another amount"
              value={mgText}
              onChange={(e) => {
                setMgText(e.target.value)
                setError('')
              }}
            />
          </div>
          {earlierDoses.length > 0 && (
            <p className="health-form__context">
              Doses so far: {earlierDoses.map((d) => `${d.mg} mg on ${fmtDate(d.date)}`).join(' and ')}
            </p>
          )}
        </>
      )}

      {kind === 'event' && (
        <div className="field">
          <span className="field__label">What happened</span>
          <input
            className="input"
            type="text"
            placeholder="Trip to Italy"
            value={label}
            autoFocus
            onChange={(e) => {
              setLabel(e.target.value)
              setError('')
            }}
          />
          <div className="chips health-form__ideas">
            {EVENT_IDEAS.map((i) => (
              <button key={i} type="button" className="chip" onClick={() => setLabel(i)}>
                {i}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="health-form__error" role="alert">
          {error}
        </p>
      )}
      {flash && !error && <p className="health-form__flash">{flash}</p>}

      <div className="health-form__actions">
        {canAddNext && (
          <button type="button" className="btn btn--primary btn--full" onClick={() => save(true)}>
            Save and add {fmtDate(nextDate)}
          </button>
        )}
        <button type="button" className={`btn btn--full ${canAddNext ? 'btn--secondary' : 'btn--primary'}`} onClick={() => save(false)}>
          Save and close
        </button>
        <button type="button" className="btn btn--link btn--full" onClick={onClose}>
          {flash ? 'Done' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}
