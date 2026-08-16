export default function SetRow({ index, set, showTargetInputs, showActualInputs, onChange, onRemove }) {
  const hasTarget = set.targetWeight != null || set.targetReps != null

  return (
    <div className="set-row">
      <span className="set-row__num">{index + 1}</span>

      {showTargetInputs && (
        <div className="set-row__fields">
          <input
            className="input input--num"
            type="number"
            inputMode="decimal"
            placeholder="lbs"
            value={set.targetWeight ?? ''}
            onChange={(e) => onChange({ targetWeight: e.target.value === '' ? null : Number(e.target.value) })}
          />
          <span className="set-row__x">×</span>
          <input
            className="input input--num"
            type="number"
            inputMode="numeric"
            placeholder="reps"
            value={set.targetReps ?? ''}
            onChange={(e) => onChange({ targetReps: e.target.value === '' ? null : Number(e.target.value) })}
          />
        </div>
      )}

      {showActualInputs && (
        <div className="set-row__fields">
          {!showTargetInputs && hasTarget && (
            <span className="set-row__target">
              target {set.targetWeight ?? '–'} × {set.targetReps ?? '–'}
            </span>
          )}
          <input
            className="input input--num"
            type="number"
            inputMode="decimal"
            placeholder="lbs"
            value={set.actualWeight ?? ''}
            onChange={(e) => onChange({ actualWeight: e.target.value === '' ? null : Number(e.target.value) })}
          />
          <span className="set-row__x">×</span>
          <input
            className="input input--num"
            type="number"
            inputMode="numeric"
            placeholder="reps"
            value={set.actualReps ?? ''}
            onChange={(e) => onChange({ actualReps: e.target.value === '' ? null : Number(e.target.value) })}
          />
        </div>
      )}

      {onRemove && (
        <button type="button" className="btn btn--icon btn--danger" aria-label="Remove set" onClick={onRemove}>
          ✕
        </button>
      )}
    </div>
  )
}
