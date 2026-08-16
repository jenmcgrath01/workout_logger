import EntryCard from './EntryCard'

export default function HomeView({ entries, today, onStartPlan, onLogFly, onOpenLog, onEdit, onDelete }) {
  const todaysEntries = entries.filter((e) => e.date === today)
  const planned = todaysEntries.filter((e) => e.status === 'planned')
  const completed = todaysEntries.filter((e) => e.status === 'completed')

  return (
    <div className="home-view">
      <p className="app-title">Workout Tracker</p>
      <h1 className="page-title">Today</h1>

      <div className="home-view__actions">
        <button type="button" className="btn btn--primary btn--full" onClick={onStartPlan}>
          + Plan a session
        </button>
        <button type="button" className="btn btn--secondary btn--full" onClick={onLogFly}>
          + Log on the fly
        </button>
      </div>

      {planned.length > 0 && (
        <section>
          <h2 className="section-title">Planned</h2>
          {planned.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onLog={onOpenLog} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="section-title">Completed today</h2>
          {completed.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </section>
      )}

      {planned.length === 0 && completed.length === 0 && <p className="empty-hint">Nothing planned or logged yet today.</p>}
    </div>
  )
}
