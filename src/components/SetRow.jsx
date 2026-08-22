export default function SetRow({
  index,
  set,
  showTargetInputs,
  showActualInputs,
  showWeight = true,
  timed = false,
  onChange,
  onRemove,
}) {
  const countField = timed ? 'Seconds' : 'Reps'
  const countPlaceholder = timed ? 'secs' : 'reps'
  const hasTarget = showWeight
    ? set.targetWeight != null || set[`target${countField}`] != null
    : set[`target${countField}`] != null

  return (
    <div className="set-row">
      <span className="set-row__num">{index + 1}</span>

      {showTargetInputs && (
        <div className="set-row__fields">
          {showWeight && (
            <>
              <input
                className="input input--num"
                type="number"
                inputMode="decimal"
                placeholder="lbs"
                value={set.targetWeight ?? ''}
                onChange={(e) => onChange({ targetWeight: e.target.value === '' ? null : Number(e.target.value) })}
              />
              <span className="set-row__x">×</span>
            </>
          )}
          <input
            className="input input--num"
            type="number"
            inputMode="numeric"
            placeholder={countPlaceholder}
            value={set[`target${countField}`] ?? ''}
            onChange={(e) => onChange({ [`target${countField}`]: e.target.value === '' ? null : Number(e.target.value) })}
          />
          {timed && <span className="set-row__unit">sec</span>}
        </div>
      )}

      {showActualInputs && (
        <div className="set-row__fields">
          {/* Timed sets carry their unit in the "sec" suffix instead, so this
              label would just repeat it. */}
          {!showTargetInputs && !timed && hasTarget && (
            <span className="set-row__target">
              target {showWeight ? `${set.targetWeight ?? '–'} × ${set.targetReps ?? '–'}` : `${set.targetReps ?? '–'} reps`}
            </span>
          )}
          {showWeight && (
            <>
              <input
                className="input input--num"
                type="number"
                inputMode="decimal"
                placeholder="lbs"
                value={set.actualWeight ?? ''}
                onChange={(e) => onChange({ actualWeight: e.target.value === '' ? null : Number(e.target.value) })}
              />
              <span className="set-row__x">×</span>
            </>
          )}
          <input
            className="input input--num"
            type="number"
            inputMode="numeric"
            placeholder={countPlaceholder}
            value={set[`actual${countField}`] ?? ''}
            onChange={(e) => onChange({ [`actual${countField}`]: e.target.value === '' ? null : Number(e.target.value) })}
          />
          {timed && <span className="set-row__unit">sec</span>}
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
