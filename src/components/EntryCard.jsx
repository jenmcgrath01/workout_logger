function formatSet(set, bodyweight, prefix) {
  const reps = set[`${prefix}Reps`]
  if (bodyweight) return `${reps ?? '–'} reps`
  const weight = set[`${prefix}Weight`]
  return `${weight ?? '–'} lbs × ${reps ?? '–'}`
}

export default function EntryCard({ entry, onLog, onEdit, onDelete }) {
  const isPlanned = entry.status === 'planned'

  return (
    <div className="entry-card">
      <div className="entry-card__header">
        <span className="entry-card__name">{entry.exerciseName}</span>
        {isPlanned && <span className="badge">planned</span>}
      </div>

      <ul className="entry-card__sets">
        {entry.sets.map((s, i) => {
          const hasTarget = entry.bodyweight ? s.targetReps != null : s.targetWeight != null || s.targetReps != null
          return (
            <li key={i}>
              {isPlanned ? (
                formatSet(s, entry.bodyweight, 'target')
              ) : (
                <>
                  {formatSet(s, entry.bodyweight, 'actual')}
                  {hasTarget && (
                    <span className="entry-card__target"> (target {formatSet(s, entry.bodyweight, 'target')})</span>
                  )}
                </>
              )}
            </li>
          )
        })}
      </ul>

      {entry.notes && <p className="entry-card__notes">{entry.notes}</p>}

      <div className="entry-card__actions">
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
