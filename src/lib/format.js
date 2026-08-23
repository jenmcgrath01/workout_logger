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
