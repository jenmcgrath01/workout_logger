export function formatMMSS(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

// Cardio durations are whole minutes (no pace field, so no need for
// sub-minute precision) — hours:minutes once it crosses 60.
export function formatMinutes(totalMinutes) {
  const m = Math.max(0, Math.round(totalMinutes))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return `${h}:${String(r).padStart(2, '0')}`
}

// One set as text: "140 lbs × 9", "45 reps", "1:30" or "2 min". `prefix` is
// 'target' or 'actual'.
export function formatSet(set, entry, prefix) {
  if (entry.timed) {
    const secs = set[`${prefix}Seconds`]
    const timeUnit = entry.timeUnit ?? 'seconds'
    let hold
    if (secs == null) {
      hold = '–'
    } else if (timeUnit === 'minutes') {
      hold = `${secs / 60} min`
    } else {
      hold = formatMMSS(secs)
    }
    if (entry.bodyweight) return hold
    const weight = set[`${prefix}Weight`]
    return weight == null ? hold : `${weight} lbs × ${hold}`
  }
  const reps = set[`${prefix}Reps`]
  if (entry.bodyweight) return `${reps ?? '–'} reps`
  const weight = set[`${prefix}Weight`]
  return `${weight ?? '–'} lbs × ${reps ?? '–'}`
}
