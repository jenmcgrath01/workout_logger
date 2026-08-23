import { formatMinutes } from '../lib/format'
import ReorderControls from './ReorderControls'

function formatStat(entry, prefix) {
  const minutes = entry[`${prefix}Minutes`]
  const miles = entry[`${prefix}Miles`]
  const parts = []
  if (minutes != null) parts.push(formatMinutes(minutes))
  if (miles != null) parts.push(`${miles} mi`)
  return parts.length ? parts.join(' · ') : '–'
}

export default function CardioCard({ entry, onLog, onEdit, onDelete, onMoveUp, onMoveDown }) {
  const isPlanned = entry.status === 'planned'
  const hasTarget = entry.targetMinutes != null || entry.targetMiles != null

  return (
    <div className="entry-card">
      <div className="entry-card__header">
        <span className="entry-card__name">{entry.exerciseName}</span>
        {isPlanned && <span className="badge">planned</span>}
      </div>

      <p className="cardio-card__stats">
        {isPlanned ? (
          formatStat(entry, 'target')
        ) : (
          <>
            {formatStat(entry, 'actual')}
            {hasTarget && <span className="entry-card__target"> (target {formatStat(entry, 'target')})</span>}
          </>
        )}
      </p>

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
