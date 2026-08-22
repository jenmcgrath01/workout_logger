import EntryCard from './EntryCard'
import RestCard from './RestCard'
import DayTheme from './DayTheme'
import { addDays } from '../lib/storage'

function formatDateLabel(dateISO, today) {
  if (dateISO === today) return 'Today'
  if (dateISO === addDays(today, -1)) return 'Yesterday'
  if (dateISO === addDays(today, 1)) return 'Tomorrow'
  const [y, m, d] = dateISO.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function HomeView({
  entries,
  today,
  selectedDate,
  onDateChange,
  onStartPlan,
  onLogFly,
  onOpenLog,
  onEdit,
  onDelete,
  onStartRest,
  onFinishRest,
  onCancelRestTimer,
  theme,
  themeCatalog,
  onSaveTheme,
}) {
  const dayEntries = entries.filter((e) => e.date === selectedDate)
  const planned = dayEntries.filter((e) => e.status === 'planned')
  const completed = dayEntries.filter((e) => e.status === 'completed')

  return (
    <div className="home-view">
      <p className="app-title">Workout Tracker</p>

      <div className="date-nav">
        <button
          type="button"
          className="btn btn--icon"
          aria-label="Previous day"
          onClick={() => onDateChange(addDays(selectedDate, -1))}
        >
          ‹
        </button>
        <input className="input date-nav__input" type="date" value={selectedDate} onChange={(e) => onDateChange(e.target.value)} />
        <button
          type="button"
          className="btn btn--icon"
          aria-label="Next day"
          onClick={() => onDateChange(addDays(selectedDate, 1))}
        >
          ›
        </button>
      </div>

      <div className="home-view__date-row">
        <h1 className="page-title">{formatDateLabel(selectedDate, today)}</h1>
        {selectedDate !== today && (
          <button type="button" className="btn btn--link" onClick={() => onDateChange(today)}>
            Jump to today
          </button>
        )}
      </div>

      <div className="home-view__theme">
        <DayTheme date={selectedDate} theme={theme} catalog={themeCatalog} onSave={onSaveTheme} />
      </div>

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
          {planned.map((entry) =>
            entry.type === 'rest' ? (
              <RestCard
                key={entry.id}
                entry={entry}
                onStart={onStartRest}
                onFinish={onFinishRest}
                onCancelTimer={onCancelRestTimer}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ) : (
              <EntryCard key={entry.id} entry={entry} onLog={onOpenLog} onEdit={onEdit} onDelete={onDelete} />
            )
          )}
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="section-title">Completed</h2>
          {completed.map((entry) =>
            entry.type === 'rest' ? (
              <RestCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
            ) : (
              <EntryCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
            )
          )}
        </section>
      )}

      {planned.length === 0 && completed.length === 0 && <p className="empty-hint">Nothing planned or logged for this day.</p>}
    </div>
  )
}
