import { formatMMSS } from '../lib/format'
import { unlockAudio } from '../lib/audio'
import { useRestTimer } from '../lib/useRestTimer'

// The rest step of a guided workout: a big countdown that is already running
// when you arrive. "Next" ends the rest, recording how long it actually was.
export default function RunRest({ entry, onNext, onSkip, onStart }) {
  const { running, elapsed, remaining, overtime } = useRestTimer(entry)

  return (
    <div className="run-rest">
      <h2 className="log-view__title">Rest</h2>
      <p className="run-rest__target">Target {formatMMSS(entry.targetSeconds)}</p>

      {running ? (
        <p className={`run-rest__clock ${overtime ? 'run-rest__clock--over' : ''}`}>
          {overtime ? '+' : ''}
          {formatMMSS(Math.abs(remaining))}
        </p>
      ) : (
        <button
          type="button"
          className="btn btn--secondary btn--full"
          onClick={() => {
            unlockAudio()
            onStart(entry)
          }}
        >
          Start rest timer
        </button>
      )}

      <button type="button" className="btn btn--primary btn--full" onClick={() => onNext(Math.round(elapsed))}>
        Done resting — next →
      </button>
      <button type="button" className="btn btn--link btn--full" onClick={onSkip}>
        Skip rest
      </button>
    </div>
  )
}
