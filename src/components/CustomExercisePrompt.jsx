import { useState } from 'react'
import { MUSCLES } from '../lib/exerciseDb'

// The explicit "you're creating a custom exercise" step. Nothing here is
// silent: the name isn't in the standard database, and this says so before
// anything is saved.
// `allowFlags` shows timed/bodyweight checkboxes for callers (the picker) that
// don't already have those on screen; the exercise form passes its own values.
export default function CustomExercisePrompt({
  name,
  timed = false,
  bodyweight = false,
  allowFlags = false,
  onConfirm,
  onCancel,
  confirmLabel = 'Save as custom',
}) {
  const [muscles, setMuscles] = useState([])
  const [timedLocal, setTimedLocal] = useState(timed)
  const [bodyLocal, setBodyLocal] = useState(bodyweight)

  function toggle(m) {
    setMuscles((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))
  }

  const traits = [timedLocal && 'timed hold', bodyLocal && 'bodyweight'].filter(Boolean)

  return (
    <div className="custom-prompt" role="alert">
      <p className="custom-prompt__title">“{name}” isn’t in the exercise database</p>
      <p className="custom-prompt__text">
        It will be saved as a <strong>custom exercise</strong>
        {traits.length > 0 && <> ({traits.join(', ')})</>} so you can reuse it. Optionally pick the muscles it works, so
        it shows up when you browse by theme.
      </p>
      {allowFlags && (
        <>
          <label className="field field--checkbox">
            <input type="checkbox" checked={timedLocal} onChange={(e) => setTimedLocal(e.target.checked)} />
            <span>Timed hold (plank, hang…)</span>
          </label>
          <label className="field field--checkbox">
            <input type="checkbox" checked={bodyLocal} onChange={(e) => setBodyLocal(e.target.checked)} />
            <span>Bodyweight, no weight</span>
          </label>
        </>
      )}
      <div className="chips">
        {MUSCLES.map((m) => (
          <button
            key={m}
            type="button"
            className={`chip ${muscles.includes(m) ? 'is-selected' : ''}`}
            onClick={() => toggle(m)}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn--secondary btn--full" onClick={onCancel}>
          Change name
        </button>
        <button type="button" className="btn btn--primary btn--full" onClick={() => onConfirm({ muscles, timed: timedLocal, bodyweight: bodyLocal })}>
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}
