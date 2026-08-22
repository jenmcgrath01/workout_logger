import { useState } from 'react'

const PRESETS = [30, 60, 90, 120, 180]

function formatPreset(seconds) {
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export default function RestForm({ entry, onSave, onCancel }) {
  const [seconds, setSeconds] = useState(entry?.targetSeconds ?? 60)

  function handleSubmit(e) {
    e.preventDefault()
    if (!seconds || seconds <= 0) return
    onSave({ targetSeconds: seconds })
  }

  return (
    <form className="rest-form" onSubmit={handleSubmit}>
      <div className="field">
        <span className="field__label">Rest duration</span>
        <div className="rest-form__presets">
          {PRESETS.map((s) => (
            <button
              key={s}
              type="button"
              className={`btn btn--secondary ${seconds === s ? 'is-selected' : ''}`}
              onClick={() => setSeconds(s)}
            >
              {formatPreset(s)}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span className="field__label">Custom seconds</span>
        <input
          className="input"
          type="number"
          inputMode="numeric"
          min="5"
          step="5"
          value={seconds}
          onChange={(e) => setSeconds(e.target.value === '' ? '' : Number(e.target.value))}
          required
        />
      </label>

      <div className="form-actions">
        <button type="button" className="btn btn--secondary btn--full" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary btn--full">
          {entry ? 'Save' : 'Add rest'}
        </button>
      </div>
    </form>
  )
}
