import { useMemo, useState } from 'react'
import CustomExercisePrompt from './CustomExercisePrompt'
import { MUSCLES, byMuscles, dbEntry, nameKey, suggest } from '../lib/exerciseDb'
import { musclesForTheme } from '../lib/themeMuscles'
import { EQUIPMENT_LABELS, EQUIPMENT_OPTIONS } from '../lib/equipment'

const PAGE = 30

function metaFor(name, custom) {
  const c = custom[name]
  if (c) return (c.muscles ?? []).join(', ')
  const e = dbEntry(name)
  return e ? [e.muscle, e.equipment].filter(Boolean).join(' · ') : ''
}

export default function ExercisePicker({ theme, catalog, custom, equipment = [], onEquipmentChange, onAdd, onAddCustom, onClose }) {
  const themed = musclesForTheme(theme)
  const [muscles, setMuscles] = useState(themed.muscles)
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState([])
  const [limit, setLimit] = useState(PAGE)
  const [creating, setCreating] = useState(null)

  const customNames = Object.keys(custom)
  const done = useMemo(() => new Set(catalog.map(nameKey)), [catalog])

  const rows = useMemo(() => {
    if (query.trim()) {
      return suggest(query, { history: catalog, custom: customNames, equipment }, 200).map(({ name, source }) => ({
        name,
        source,
        meta: metaFor(name, custom),
      }))
    }
    const fromCustom = customNames
      .filter((n) => (custom[n].muscles ?? []).some((m) => muscles.includes(m)))
      .map((name) => ({ name, source: 'custom', meta: metaFor(name, custom) }))
    const fromDb = byMuscles(muscles, { equipment }).map((e) => ({ name: e.name, source: 'db', meta: metaFor(e.name, custom) }))
    // Custom ones you made, then things you've already done, then the rest.
    const rank = (r) => (r.source === 'custom' ? 0 : done.has(nameKey(r.name)) ? 1 : 2)
    return [...fromCustom, ...fromDb].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
  }, [query, muscles, catalog, custom, done, customNames, equipment])

  const typed = query.trim()
  const exact = rows.some((r) => r.name.toLowerCase() === typed.toLowerCase())

  function toggleMuscle(m) {
    setLimit(PAGE)
    setMuscles((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))
  }

  function toggleEquipment(e) {
    setLimit(PAGE)
    onEquipmentChange(equipment.includes(e) ? equipment.filter((x) => x !== e) : [...equipment, e])
  }

  function togglePick(name) {
    setPicked((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))
  }

  function confirmCustom({ muscles: chosen, timed, bodyweight }) {
    onAddCustom(creating, { muscles: chosen, timed, bodyweight })
    setPicked((prev) => [...prev, creating])
    setCreating(null)
    setQuery('')
  }

  return (
    <div className="picker">
      <div className="picker__head">
        <h2 className="picker__title">Browse exercises</h2>
        <button type="button" className="btn btn--link" onClick={onClose}>
          Close
        </button>
      </div>

      {theme && (
        <p className="picker__theme">
          {themed.matched && muscles.length > 0
            ? `Showing ${theme} muscles — tap to change`
            : `Pick the muscle groups for “${theme}”`}
        </p>
      )}

      <div className="chips">
        {MUSCLES.map((m) => (
          <button key={m} type="button" className={`chip ${muscles.includes(m) ? 'is-selected' : ''}`} onClick={() => toggleMuscle(m)}>
            {m}
          </button>
        ))}
      </div>

      {onEquipmentChange && (
        <>
          <p className="picker__theme">What you have — only these are listed{equipment.length === 0 ? ' (none chosen: showing everything)' : ''}</p>
          <div className="chips">
            {EQUIPMENT_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                className={`chip ${equipment.includes(e) ? 'is-selected' : ''}`}
                onClick={() => toggleEquipment(e)}
              >
                {EQUIPMENT_LABELS[e] ?? e}
              </button>
            ))}
          </div>
        </>
      )}

      <input
        className="input"
        type="search"
        placeholder="Search all exercises"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setLimit(PAGE)
        }}
      />

      {creating ? (
        <CustomExercisePrompt
          name={creating}
          allowFlags
          onConfirm={confirmCustom}
          onCancel={() => setCreating(null)}
          confirmLabel="Save as custom & select"
        />
      ) : (
        <>
          {typed && !exact && (
            <button type="button" className="picker__create" onClick={() => setCreating(typed)}>
              + Add “{typed}” as a custom exercise (not in the database)
            </button>
          )}

          <ul className="picker__rows">
            {rows.slice(0, limit).map((r) => (
              <li key={r.name}>
                <button
                  type="button"
                  className={`picker__row ${picked.includes(r.name) ? 'is-selected' : ''}`}
                  onClick={() => togglePick(r.name)}
                >
                  <span className="picker__check">{picked.includes(r.name) ? '✓' : ''}</span>
                  <span className="picker__name">
                    {r.name}
                    {r.source === 'custom' && <span className="tag tag--custom">custom</span>}
                    {done.has(nameKey(r.name)) && <span className="tag">done before</span>}
                  </span>
                  {r.meta && <span className="picker__meta">{r.meta}</span>}
                </button>
              </li>
            ))}
          </ul>

          {rows.length === 0 && (
            <p className="empty-hint">
              {typed
                ? 'No matches.'
                : muscles.length === 0
                  ? 'Pick a muscle group above.'
                  : 'Nothing for those muscles with your equipment — add more equipment above.'}
            </p>
          )}
          {rows.length > limit && (
            <button type="button" className="btn btn--link" onClick={() => setLimit((l) => l + PAGE)}>
              Show more ({rows.length - limit} left)
            </button>
          )}
        </>
      )}

      <div className="picker__footer">
        <button type="button" className="btn btn--primary btn--full" disabled={picked.length === 0} onClick={() => onAdd(picked)}>
          {picked.length ? `Add ${picked.length} to plan` : 'Select exercises to add'}
        </button>
      </div>
    </div>
  )
}
