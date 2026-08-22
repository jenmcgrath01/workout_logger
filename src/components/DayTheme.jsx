import { useEffect, useState } from 'react'
import Autocomplete from './Autocomplete'

export default function DayTheme({ date, theme, catalog, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(theme ?? '')

  // Navigating to another day should abandon an in-progress edit rather than
  // carry the draft over to the new date.
  useEffect(() => {
    setEditing(false)
  }, [date])

  function beginEdit() {
    setDraft(theme ?? '')
    setEditing(true)
  }

  function save() {
    onSave(date, draft)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button type="button" className={`day-theme ${theme ? '' : 'day-theme--empty'}`} onClick={beginEdit}>
        {theme || '+ Add a theme'}
      </button>
    )
  }

  return (
    <div className="day-theme__editor">
      <Autocomplete
        value={draft}
        onChange={setDraft}
        catalog={catalog}
        placeholder="Upper body, cardio, rest day…"
        autoFocus
      />
      <div className="day-theme__actions">
        <button type="button" className="btn btn--secondary" onClick={() => setEditing(false)}>
          Cancel
        </button>
        {theme && (
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              onSave(date, '')
              setEditing(false)
            }}
          >
            Clear
          </button>
        )}
        <button type="button" className="btn btn--primary" onClick={save}>
          Save
        </button>
      </div>
    </div>
  )
}
