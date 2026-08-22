import { formatMMSS } from '../lib/format'
import ReorderControls from './ReorderControls'

function formatSet(set, entry, prefix) {
  if (entry.timed) {
    const secs = set[`${prefix}Seconds`]
    const hold = secs == null ? '–' : formatMMSS(secs)
    if (entry.bodyweight) return hold
    const weight = set[`${prefix}Weight`]
    return weight == null ? hold : `${weight} lbs × ${hold}`
  }
  const reps = set[`${prefix}Reps`]
  if (entry.bodyweight) return `${reps ?? '–'} reps`
  const weight = set[`${prefix}Weight`]
  return `${weight ?? '–'} lbs × ${reps ?? '–'}`
}

function hasTargetFor(set, entry) {
  const count = entry.timed ? set.targetSeconds : set.targetReps
  return entry.bodyweight ? count != null : set.targetWeight != null || count != null
}

export default function EntryCard({ entry, onLog, onEdit, onDelete, onMoveUp, onMoveDown }) {
  const isPlanned = entry.status === 'planned'

  return (
    <div className="entry-card">
      <div className="entry-card__header">
        <span className="entry-card__name">{entry.exerciseName}</span>
        {isPlanned && <span className="badge">planned</span>}
      </div>

      <ul className="entry-card__sets">
        {entry.sets.map((s, i) => (
          <li key={i}>
            {isPlanned ? (
              formatSet(s, entry, 'target')
            ) : (
              <>
                {formatSet(s, entry, 'actual')}
                {hasTargetFor(s, entry) && (
                  <span className="entry-card__target"> (target {formatSet(s, entry, 'target')})</span>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      {entry.notes && <p className="entry-card__notes">{entry.notes}</p>}

      <div className="entry-card__actions">
        <ReorderControls onMoveUp={onMoveUp} onMoveDown={onMoveDown} />
        {isPlanned && onLog && (
          <button type="button" className="btn btn--primary" onClick={() => onLog(entry)}>
            Log
          </button>
        )}
        <button type="button" className="btn btn--secondary" onClick={() => onEdit(entry)}>
          Edit
        </button>
        <button type="button" className="btn btn--danger" onClick={() => onDelete(entry)}>
          Delete
        </button>
      </div>
    </div>
  )
}
