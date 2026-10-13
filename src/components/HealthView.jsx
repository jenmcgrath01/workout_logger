import { useState } from 'react'
import {
  RANGES, addEvent, colorForDose, deleteItem, doseChanges, rangeStartISO, setHalfLife, summarize, upsertDose, upsertWeight, weightPoints,
} from '../lib/health'
import { fmtDate } from '../lib/useChartHover'
import HealthEntryForm from './HealthEntryForm'
import OnBoardChart from './OnBoardChart'
import WeightChart from './WeightChart'

const KINDS = { weight: 'weights', dose: 'doses', event: 'events' }
const HISTORY_LIMIT = 12

function rowText(kind, item) {
  if (kind === 'weight') return `${item.weight} lb`
  if (kind === 'dose') return `${item.mg} mg`
  return item.label
}

export default function HealthView({ health, today, onChange }) {
  const [range, setRange] = useState('All')
  const [form, setForm] = useState(null)
  const [showAll, setShowAll] = useState(false)

  const summary = summarize(health, today)
  const firstDates = [health.weights[0]?.date, health.doses[0]?.date].filter(Boolean).sort()
  // The charts end today (or your last weigh-in), so a dose scheduled for the
  // future doesn't stretch the axis.
  const lastDates = [health.weights[health.weights.length - 1]?.date, today].filter(Boolean).sort()
  const endISO = lastDates[lastDates.length - 1]
  const startISO = rangeStartISO(range, endISO, firstDates[0])

  const points = weightPoints(health)
  const visible = points.filter((p) => p.date >= startISO && p.date <= endISO)
  const changes = doseChanges(visible)
  const dosesShown = [...new Set(visible.map((p) => p.dose).filter((d) => d != null))]

  function save(values) {
    const { kind, ...data } = values
    let next = health
    // Editing replaces the original, even if its date changed.
    if (form?.initial?.id) next = deleteItem(next, KINDS[kind], form.initial.id)
    if (kind === 'weight') next = upsertWeight(next, data)
    else if (kind === 'dose') next = upsertDose(next, data)
    else next = addEvent(next, data)
    onChange(next)
    // Further "save and add" entries from this form are new ones.
    setForm((f) => f && { ...f, initial: { ...f.initial, id: undefined } })
  }

  function remove(kind, item) {
    if (!window.confirm(`Delete ${rowText(kind, item)} on ${fmtDate(item.date)}?`)) return
    onChange(deleteItem(health, KINDS[kind], item.id))
  }

  if (form) {
    return (
      <div className="health-view">
        <HealthEntryForm kind={form.kind} initial={form.initial} health={health} today={today} onSave={save} onClose={() => setForm(null)} />
      </div>
    )
  }

  const history = [
    ...health.weights.map((item) => ({ kind: 'weight', item })),
    ...health.doses.map((item) => ({ kind: 'dose', item })),
    ...health.events.map((item) => ({ kind: 'event', item })),
  ].sort((a, b) => (a.item.date < b.item.date ? 1 : a.item.date > b.item.date ? -1 : 0))
  const shownHistory = showAll ? history : history.slice(0, HISTORY_LIMIT)

  const add = (kind) => setForm({ kind, initial: {} })

  return (
    <div className="health-view">
      <h1 className="page-title">Health</h1>

      {!summary.hasData ? (
        <div className="health-empty">
          <h2 className="section-title">Track weight and GLP-1</h2>
          <p>
            Log your weigh-ins and doses to see your weight against your dose level, and how much GLP-1 is on board. You can
            start from any past date.
          </p>
        </div>
      ) : (
        <>
          <div className="metrics">
            <div className="metric">
              <span className="metric__label">Weight</span>
              <span className="metric__value">{summary.latestWeight != null ? summary.latestWeight : '–'}</span>
              {summary.changeSinceStart != null && (
                <span className="metric__sub">
                  {summary.changeSinceStart > 0 ? '+' : ''}
                  {summary.changeSinceStart.toFixed(1)} since start
                </span>
              )}
            </div>
            <div className="metric">
              <span className="metric__label">On board</span>
              <span className="metric__value">{summary.onBoardNow != null ? `${summary.onBoardNow.toFixed(1)} mg` : '–'}</span>
            </div>
            <div className="metric">
              <span className="metric__label">Dose</span>
              <span className="metric__value">{summary.currentDose != null ? `${summary.currentDose} mg` : '–'}</span>
              {summary.lastDoseDate && <span className="metric__sub">{fmtDate(summary.lastDoseDate)}</span>}
            </div>
          </div>

          <div className="chips health-view__ranges">
            {RANGES.map((r) => (
              <button key={r.key} type="button" className={`chip ${range === r.key ? 'is-selected' : ''}`} onClick={() => setRange(r.key)}>
                {r.key}
              </button>
            ))}
          </div>

          <section className="health-view__chart">
            <h2 className="section-title">Weight and dose</h2>
            {health.weights.length > 0 ? (
              <>
                <WeightChart points={points} changes={changes} events={health.events} startISO={startISO} endISO={endISO} />
                <p className="chart-legend">
                  {dosesShown.map((d) => (
                    <span key={d} className="chart-legend__item">
                      <span className="chart-legend__dot" style={{ background: colorForDose(d) }} />
                      {d} mg
                    </span>
                  ))}
                  <span className="chart-legend__item">
                    <span className="chart-legend__dash" />7-entry average
                  </span>
                </p>
              </>
            ) : (
              <p className="chart-empty">Log a weigh-in to see this graph.</p>
            )}
          </section>

          <section className="health-view__chart">
            <h2 className="section-title">GLP-1 on board</h2>
            {health.doses.length > 0 ? (
              <>
                <OnBoardChart
                  doses={health.doses}
                  halfLifeDays={health.settings.halfLifeDays}
                  events={health.events}
                  startISO={rangeStartISO(range, endISO, health.doses[0].date)}
                  endISO={endISO}
                />
                <p className="chart-note">
                  An estimate: each dose halves every {health.settings.halfLifeDays} days. Not a clinical level.
                </p>
              </>
            ) : (
              <p className="chart-empty">Log a dose to see this graph.</p>
            )}
          </section>
        </>
      )}

      <div className="health-view__add">
        <button type="button" className="btn btn--primary btn--full" onClick={() => add('weight')}>
          + Weight
        </button>
        <button type="button" className="btn btn--secondary btn--full" onClick={() => add('dose')}>
          + Dose
        </button>
        <button type="button" className="btn btn--secondary btn--full" onClick={() => add('event')}>
          + Event
        </button>
      </div>

      {history.length > 0 && (
        <section>
          <h2 className="section-title">History</h2>
          <ul className="health-history">
            {shownHistory.map(({ kind, item }) => (
              <li key={`${kind}${item.id}`} className="health-history__row">
                <span className={`health-history__kind health-history__kind--${kind}`}>{kind}</span>
                <span className="health-history__main">
                  <span className="health-history__value">{rowText(kind, item)}</span>
                  <span className="health-history__date">{fmtDate(item.date)}</span>
                </span>
                <button
                  type="button"
                  className="btn btn--link"
                  onClick={() =>
                    setForm({
                      kind,
                      initial: { id: item.id, date: item.date, weight: item.weight, mg: item.mg, label: item.label },
                    })
                  }
                >
                  Edit
                </button>
                <button type="button" className="btn btn--link health-history__delete" onClick={() => remove(kind, item)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
          {history.length > HISTORY_LIMIT && (
            <button type="button" className="btn btn--link" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Show fewer' : `Show all ${history.length}`}
            </button>
          )}
        </section>
      )}

      <section>
        <h2 className="section-title">Settings</h2>
        <label className="field health-settings">
          <span className="field__label">GLP-1 half-life (days)</span>
          <input
            key={health.settings.halfLifeDays}
            className="input"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="1"
            defaultValue={health.settings.halfLifeDays}
            onBlur={(e) => onChange(setHalfLife(health, e.target.value))}
          />
          <span className="health-form__hint">Used for the on-board graph. 7 days is the usual figure for semaglutide; tirzepatide is nearer 5.</span>
        </label>
      </section>
    </div>
  )
}
