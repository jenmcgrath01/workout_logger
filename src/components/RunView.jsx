import { formatMMSS } from '../lib/format'
import { describeEntry } from '../lib/summary'
import { isStepDone, nextLiveIndex, progress, stepKind, summarizeRun } from '../lib/runner'
import CardioForm from './CardioForm'
import LogExerciseView from './LogExerciseView'
import RunComplete from './RunComplete'
import RunRest from './RunRest'

function upNextLabel(ids, entries, index) {
  const next = entries.find((e) => e.id === ids[nextLiveIndex(ids, entries, index)])
  if (!next) return 'Finish workout'
  return next.type === 'rest' ? `Rest ${formatMMSS(next.targetSeconds)}` : next.exerciseName
}

export default function RunView({
  entries,
  run,
  cardioCatalog,
  onBack,
  onPersist,
  onCompleteStrength,
  onCompleteCardio,
  onFinishRest,
  onSkipRest,
  onStartRest,
  onNext,
  onSkip,
  onRemove,
  onFinish,
}) {
  const { ids, index, skipped, startedAt } = run
  const entry = entries.find((e) => e.id === ids[index])

  if (index >= ids.length || !entry) {
    return <RunComplete summary={summarizeRun(ids, entries, skipped)} startedAt={startedAt} onFinish={onFinish} />
  }

  const kind = stepKind(entry)
  const done = isStepDone(entry, skipped)
  const { position, total } = progress(ids, entries, index)
  const fraction = (position - 1 + (entry.status === 'completed' ? 1 : 0)) / total

  const nextButton = (
    <>
      <button type="button" className="btn btn--primary btn--full" onClick={onNext}>
        Next →
      </button>
      <p className="run-view__upnext">Up next: {upNextLabel(ids, entries, index)}</p>
    </>
  )

  return (
    <div className="run-view">
      <div className="run-view__top">
        <button type="button" className="btn btn--link" onClick={onBack}>
          ← Back
        </button>
        <span className="run-view__step">
          Step {position} of {total}
        </span>
      </div>
      <div className="run-view__bar" aria-hidden="true">
        <div className="run-view__bar-fill" style={{ width: `${Math.round(fraction * 100)}%` }} />
      </div>

      {kind === 'strength' && (
        <LogExerciseView
          key={entry.id}
          entry={entry}
          hideBack
          done={done}
          doneAction={nextButton}
          onPersist={(updates) => onPersist(entry.id, updates)}
          onComplete={(updates) => onCompleteStrength(entry, updates)}
        />
      )}

      {kind === 'cardio' &&
        (done ? (
          <div className="run-view__logged">
            <h2 className="log-view__title">{entry.exerciseName}</h2>
            <p className="run-view__summary">{describeEntry(entry).detail}</p>
            {nextButton}
          </div>
        ) : (
          <div>
            <h2 className="log-view__title">{entry.exerciseName}</h2>
            <CardioForm
              key={entry.id}
              mode="log"
              entry={entry}
              catalog={cardioCatalog}
              cancelLabel="Skip"
              onSave={(data) => onCompleteCardio(entry, data)}
              onCancel={() => onSkip(entry)}
            />
          </div>
        ))}

      {kind === 'rest' &&
        (entry.status === 'completed' ? (
          <div className="run-view__logged">
            <h2 className="log-view__title">Rest</h2>
            <p className="run-view__summary">Rested {describeEntry(entry).detail}</p>
            {nextButton}
          </div>
        ) : (
          <RunRest
            key={entry.id}
            entry={entry}
            onStart={onStartRest}
            onNext={(elapsed) => onFinishRest(entry, elapsed)}
            onSkip={() => onSkipRest(entry)}
          />
        ))}

      {kind !== 'rest' && !done && (
        <button type="button" className="btn btn--secondary btn--full run-view__skip" onClick={() => onSkip(entry)}>
          Skip this {kind === 'cardio' ? 'one' : 'exercise'}
        </button>
      )}
      {kind !== 'rest' && (
        <button type="button" className="btn btn--link run-view__remove" onClick={() => onRemove(entry)}>
          Remove from workout
        </button>
      )}
    </div>
  )
}
