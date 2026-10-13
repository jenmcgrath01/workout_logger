import { useState } from 'react'
import { addDays } from '../lib/storage'
import { copyDay, entriesForDate, findLastThemeDay } from '../lib/copyDay'

function label(dateISO) {
  const [y, m, d] = dateISO.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function describe(entry) {
  if (entry.type === 'rest') return `Rest ${entry.targetSeconds}s`
  return entry.exerciseName
}

export default function CopyDay({ entries, themes, targetDate, onCopy }) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(null)
  const [custom, setCustom] = useState('')

  const theme = themes[targetDate] ?? ''
  const themeDay = findLastThemeDay(themes, theme, targetDate, entries)
  const weekAgo = addDays(targetDate, -7)

  const options = [
    themeDay && { key: 'theme', date: themeDay, text: `Last ${theme} day` },
    // Skip it when it would just repeat the themed day above.
    weekAgo !== themeDay && { key: 'week', date: weekAgo, text: 'Same day last week' },
  ].filter(Boolean)

  const source = from ? entriesForDate(entries, from) : []

  function close() {
    setOpen(false)
    setFrom(null)
    setCustom('')
  }

  function confirm() {
    onCopy(copyDay(entries, from, targetDate), from)
    close()
  }

  if (!open) {
    return (
      <button type="button" className="btn btn--secondary btn--full" onClick={() => setOpen(true)}>
        Copy a day
      </button>
    )
  }

  return (
    <div className="copy-day">
      <p className="copy-day__title">Copy a day into {label(targetDate)}</p>

      {options.map((o) => {
        const count = entriesForDate(entries, o.date).length
        return (
          <button
            key={o.key}
            type="button"
            className={`copy-day__option ${from === o.date ? 'is-selected' : ''}`}
            disabled={count === 0}
            onClick={() => setFrom(o.date)}
          >
            <span>{o.text}</span>
            <span className="copy-day__meta">
              {label(o.date)} · {count === 0 ? 'nothing logged' : `${count} item${count === 1 ? '' : 's'}`}
            </span>
          </button>
        )
      })}

      <label className="field">
        <span className="field__label">Or pick a date</span>
        <input
          className="input"
          type="date"
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value)
            setFrom(e.target.value || null)
          }}
        />
      </label>

      {from && (
        <div className="copy-day__preview">
          {source.length === 0 ? (
            <p className="copy-day__empty">Nothing on {label(from)} to copy.</p>
          ) : (
            <>
              <p className="copy-day__meta">From {label(from)} — last results become the new targets:</p>
              <ul>
                {source.map((e) => (
                  <li key={e.id}>{describe(e)}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn--secondary btn--full" onClick={close}>
          Cancel
        </button>
        <button type="button" className="btn btn--primary btn--full" disabled={source.length === 0} onClick={confirm}>
          Copy {source.length || ''} item{source.length === 1 ? '' : 's'}
        </button>
      </div>
    </div>
  )
}
