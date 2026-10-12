import { strengthFrom } from './copyDay'

export const DEFAULT_HOLD_SECONDS = 30

export function emptySet() {
  return {
    targetWeight: null,
    targetReps: null,
    targetSeconds: null,
    actualWeight: null,
    actualReps: null,
    actualSeconds: null,
  }
}

function key(s) {
  return (s ?? '').trim().toLowerCase()
}

// The most recent time this exercise was done: completed sessions beat merely
// planned ones, the latest date wins, and a later array position breaks ties.
export function lastTimeFor(name, entries) {
  const k = key(name)
  if (!k) return null
  const matches = entries.filter((e) => (e.type ?? 'strength') === 'strength' && key(e.exerciseName) === k)
  if (!matches.length) return null
  const done = matches.filter((e) => e.status === 'completed')
  const pool = done.length ? done : matches
  return pool.reduce((best, e) => (best == null || e.date >= best.date ? e : best), null)
}

// A ready-to-use draft for an exercise: last time's sets and flags if there is
// a last time, otherwise sensible blanks. `defaults` lets a caller that knows
// more (the exercise database, a custom exercise) seed the flags.
export function draftFromName(name, entries, defaults = {}) {
  const last = lastTimeFor(name, entries)
  if (last) {
    const d = strengthFrom(last, last.date)
    return {
      exerciseName: last.exerciseName,
      bodyweight: d.bodyweight,
      timed: d.timed,
      timeUnit: d.timeUnit,
      enableBeeps: d.enableBeeps,
      sets: d.sets,
      fromDate: last.date,
    }
  }
  const timed = !!defaults.timed
  const sets = Array.from({ length: 3 }, () => ({
    ...emptySet(),
    targetSeconds: timed ? DEFAULT_HOLD_SECONDS : null,
  }))
  return {
    exerciseName: (name ?? '').trim(),
    bodyweight: !!defaults.bodyweight,
    timed,
    timeUnit: 'seconds',
    enableBeeps: true,
    sets,
    fromDate: null,
  }
}
