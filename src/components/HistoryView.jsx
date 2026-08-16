import EntryCard from './EntryCard'

function groupByDateDesc(entries) {
  const byDate = new Map()
  for (const entry of entries) {
    if (!byDate.has(entry.date)) byDate.set(entry.date, [])
    byDate.get(entry.date).push(entry)
  }
  return [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
}

export default function HistoryView({ entries, onEdit, onDelete, onBack }) {
  const completed = entries.filter((e) => e.status === 'completed')
  const groups = groupByDateDesc(completed)

  return (
    <div className="history-view">
      <button type="button" className="btn btn--link" onClick={onBack}>
        ← Back
      </button>

      <h1 className="page-title">History</h1>

      {groups.length === 0 && <p className="empty-hint">No completed workouts yet.</p>}

      {groups.map(([date, dayEntries], i) => (
        <details className="history-group" key={date} open={i === 0}>
          <summary className="history-group__summary">
            <span>{date}</span>
            <span className="history-group__count">{dayEntries.length} exercise{dayEntries.length === 1 ? '' : 's'}</span>
          </summary>
          {dayEntries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </details>
      ))}
    </div>
  )
}
