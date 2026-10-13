import { describeEntry } from '../lib/summary'

export default function RunComplete({ summary, startedAt, onFinish }) {
  const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000))
  const { completed, skipped, total } = summary

  return (
    <div className="run-complete">
      <h1 className="page-title">Workout complete</h1>
      <p className="run-complete__stats">
        {completed.length} of {total} done · about {minutes} min
      </p>

      {completed.length > 0 && (
        <ul className="run-complete__list">
          {completed.map((e) => {
            const d = describeEntry(e)
            return (
              <li key={e.id}>
                <span className="run-complete__name">{d.title}</span>
                <span className="run-complete__detail">{d.detail}</span>
              </li>
            )
          })}
        </ul>
      )}

      {skipped.length > 0 && (
        <>
          <h2 className="section-title">Skipped</h2>
          <ul className="run-complete__list run-complete__list--skipped">
            {skipped.map((e) => (
              <li key={e.id}>
                <span className="run-complete__name">{e.type === 'rest' ? 'Rest' : e.exerciseName}</span>
              </li>
            ))}
          </ul>
          <p className="run-complete__note">Skipped items are still on your plan for the day.</p>
        </>
      )}

      <button type="button" className="btn btn--primary btn--full" onClick={onFinish}>
        Done
      </button>
    </div>
  )
}
