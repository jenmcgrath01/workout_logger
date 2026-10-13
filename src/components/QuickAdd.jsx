import { useState } from 'react'
import { itemToEntry, parseQuickAdd, resolveItemAs, summarizeSets } from '../lib/quickAdd'

const EXAMPLE = 'bench press 3 sets of 10 at 135\nsquat 185 for 5, 205 for 5\nrest 90 seconds\nplank 30 seconds\nrun 30 minutes 3 miles'

export default function QuickAdd({ date, entries, catalog, custom, equipment, onAdd, onAddCustom, onClose }) {
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState(null)

  const ctx = { history: catalog, custom, entries, equipment }

  function preview() {
    setParsed(parseQuickAdd(text, ctx))
  }

  function patchItem(i, next) {
    setParsed((p) => ({ ...p, items: p.items.map((it, idx) => (idx === i ? next : it)) }))
  }

  function removeItem(i) {
    setParsed((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))
  }

  // Strength items whose name isn't in the database, history or custom list
  // must be matched to a suggestion or explicitly kept as custom.
  const needsDecision = (it) => it.kind === 'strength' && !it.resolved && !it.acknowledged
  const blocked = parsed ? parsed.items.filter(needsDecision).length : 0

  function addAll() {
    for (const it of parsed.items) {
      if (it.kind === 'strength' && it.acknowledged) {
        onAddCustom(it.name, { muscles: [], timed: it.timed, bodyweight: it.bodyweight })
      }
    }
    onAdd(parsed.items.map((it) => itemToEntry(it, date)))
  }

  if (!parsed) {
    return (
      <div className="quick-add">
        <div className="picker__head">
          <h2 className="picker__title">Quick add</h2>
          <button type="button" className="btn btn--link" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="quick-add__hint">
          Type it, or tap the <strong>🎤 on your keyboard</strong> and say it. Separate exercises with a new line, or just keep
          talking.
        </p>
        <textarea
          className="input quick-add__box"
          rows={5}
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
        />
        <button type="button" className="btn btn--primary btn--full" disabled={!text.trim()} onClick={preview}>
          Preview
        </button>
      </div>
    )
  }

  return (
    <div className="quick-add">
      <div className="picker__head">
        <h2 className="picker__title">Check before adding</h2>
        <button type="button" className="btn btn--link" onClick={() => setParsed(null)}>
          ← Edit text
        </button>
      </div>

      {parsed.warnings.map((w) => (
        <p key={w} className="quick-add__warning">
          {w}
        </p>
      ))}
      {parsed.items.length === 0 && <p className="empty-hint">I didn’t hear any exercises in that.</p>}

      <ul className="quick-add__items">
        {parsed.items.map((it, i) => (
          <li key={i} className={`qa-item ${needsDecision(it) ? 'qa-item--flag' : ''}`}>
            <div className="qa-item__head">
              <span className="qa-item__name">
                {it.kind === 'rest' ? 'Rest' : it.name}
                {it.kind === 'cardio' && <span className="tag">cardio</span>}
                {it.kind === 'strength' && it.source === 'custom' && <span className="tag tag--custom">custom</span>}
                {it.kind === 'strength' && it.acknowledged && <span className="tag tag--custom">new custom</span>}
              </span>
              <button type="button" className="btn btn--icon" aria-label="Remove" onClick={() => removeItem(i)}>
                ✕
              </button>
            </div>

            <div className="qa-item__detail">
              {summarizeSets(it) || '—'}
              {it.kind === 'strength' && it.usedLastTime && <span className="qa-item__note"> · same as last time</span>}
              {it.kind === 'strength' && !it.heard && !it.usedLastTime && !it.unreadable && (
                <span className="qa-item__note"> · {it.sets.length} blank sets to fill in</span>
              )}
            </div>
            {(it.unreadable || (it.kind === 'cardio' && it.unreadable)) && (
              <div className="qa-item__warn">Couldn’t read the numbers — blank sets added; fix them after adding.</div>
            )}
            {it.kind === 'strength' && it.resolved && it.nameText.toLowerCase() !== it.name.toLowerCase() && (
              <div className="qa-item__note">heard “{it.nameText}”</div>
            )}

            {needsDecision(it) && (
              <div className="qa-item__fix">
                <p className="qa-item__warn">
                  <strong>“{it.name}” isn’t in the exercise database.</strong>
                </p>
                {it.candidates.length > 0 && (
                  <>
                    <p className="qa-item__note">Did you mean:</p>
                    <div className="chips">
                      {it.candidates.map((c) => (
                        <button key={c.name} type="button" className="chip" onClick={() => patchItem(i, resolveItemAs(it, c.name, ctx))}>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <button type="button" className="btn btn--secondary btn--full" onClick={() => patchItem(i, { ...it, acknowledged: true })}>
                  Keep “{it.name}” as a custom exercise
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="picker__footer">
        <button
          type="button"
          className="btn btn--primary btn--full"
          disabled={parsed.items.length === 0 || blocked > 0}
          onClick={addAll}
        >
          {blocked > 0
            ? `Resolve ${blocked} flagged exercise${blocked === 1 ? '' : 's'} to continue`
            : `Add ${parsed.items.length} item${parsed.items.length === 1 ? '' : 's'} to plan`}
        </button>
      </div>
    </div>
  )
}
