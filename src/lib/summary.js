import { formatMinutes, formatMMSS, formatSet } from './format'

// A one-line description of a *logged* entry, for the workout-complete screen.
export function describeEntry(e) {
  if (e.type === 'rest') {
    return { title: 'Rest', detail: formatMMSS(e.actualSeconds ?? e.targetSeconds ?? 0) }
  }
  if (e.type === 'cardio') {
    const parts = [
      e.actualMinutes != null && formatMinutes(e.actualMinutes),
      e.actualMiles != null && `${e.actualMiles} mi`,
    ].filter(Boolean)
    return { title: e.exerciseName, detail: parts.join(' · ') || '—' }
  }
  const sets = (e.sets ?? []).map((s) => formatSet(s, e, 'actual'))
  return { title: e.exerciseName, detail: sets.join(', ') || '—' }
}
