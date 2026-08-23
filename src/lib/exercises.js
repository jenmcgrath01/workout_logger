// Defaults to the strength catalog since that's the original caller; pass
// 'cardio' to get a separate name catalog for runs/rides so "Run" doesn't
// show up as a bench-press suggestion or vice versa.
export function getExerciseCatalog(entries, type = 'strength') {
  const names = new Set(entries.filter((e) => e.type === type).map((e) => e.exerciseName).filter(Boolean))
  return [...names].sort((a, b) => a.localeCompare(b))
}
