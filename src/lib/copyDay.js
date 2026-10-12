// Builds drafts for repeating one day's workout on another. Drafts carry no id
// or date-independent state of their own — storage.addEntries assigns ids.

function nameKey(s) {
  return (s ?? '').trim().toLowerCase()
}

// What you did last time becomes what you aim for this time.
function carryForward(actual, target) {
  return actual ?? target ?? null
}

export function strengthFrom(e, toDate) {
  return {
    type: 'strength',
    date: toDate,
    status: 'planned',
    exerciseName: e.exerciseName,
    bodyweight: !!e.bodyweight,
    timed: !!e.timed,
    // Same defaults ExerciseForm applies to entries saved before these existed.
    timeUnit: e.timeUnit ?? 'seconds',
    enableBeeps: e.enableBeeps ?? true,
    notes: '',
    sets: (e.sets ?? []).map((s) => ({
      targetWeight: carryForward(s.actualWeight, s.targetWeight),
      targetReps: carryForward(s.actualReps, s.targetReps),
      targetSeconds: carryForward(s.actualSeconds, s.targetSeconds),
      actualWeight: null,
      actualReps: null,
      actualSeconds: null,
    })),
  }
}

function copyRest(e, toDate) {
  return {
    type: 'rest',
    date: toDate,
    status: 'planned',
    targetSeconds: e.targetSeconds,
    actualSeconds: null,
    startedAt: null,
    notes: '',
  }
}

function copyCardio(e, toDate) {
  return {
    type: 'cardio',
    date: toDate,
    status: 'planned',
    exerciseName: e.exerciseName,
    targetMinutes: carryForward(e.actualMinutes, e.targetMinutes),
    targetMiles: carryForward(e.actualMiles, e.targetMiles),
    actualMinutes: null,
    actualMiles: null,
    notes: '',
  }
}

const COPIERS = { rest: copyRest, cardio: copyCardio }

export function entriesForDate(entries, date) {
  return entries.filter((e) => e.date === date)
}

// Entries keep their array order, which is their display order.
export function copyDay(entries, fromDate, toDate) {
  return entriesForDate(entries, fromDate).map((e) => (COPIERS[e.type] ?? strengthFrom)(e, toDate))
}

// Most recent earlier day with the same theme that actually has entries.
export function findLastThemeDay(themes, theme, beforeDate, entries) {
  const want = nameKey(theme)
  if (!want) return null
  const withEntries = new Set(entries.map((e) => e.date))
  const dates = Object.keys(themes)
    .filter((d) => d < beforeDate && nameKey(themes[d]) === want && withEntries.has(d))
    .sort()
  return dates.length ? dates[dates.length - 1] : null
}
