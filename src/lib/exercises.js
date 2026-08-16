export function getExerciseCatalog(entries) {
  const names = new Set(entries.map((e) => e.exerciseName).filter(Boolean))
  return [...names].sort((a, b) => a.localeCompare(b))
}
