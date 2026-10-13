// Pure helpers for "execute the workout". A run walks the day's entries in
// display order. The step list is a fixed array of ids taken at the start, so
// an entry deleted mid-run just drops out rather than shifting everything.

export function stepIds(entries, date) {
  return entries.filter((e) => e.date === date).map((e) => e.id)
}

function byId(entries) {
  return new Map(entries.map((e) => [e.id, e]))
}

// Index of the first step that still needs doing, or ids.length when the day
// is already complete. Missing (deleted) entries don't count as unfinished.
export function firstUnfinished(ids, entries) {
  const map = byId(entries)
  const i = ids.findIndex((id) => map.has(id) && map.get(id).status !== 'completed')
  return i === -1 ? ids.length : i
}

// Next step after `from` whose entry still exists, or ids.length at the end.
export function nextLiveIndex(ids, entries, from) {
  const map = byId(entries)
  for (let i = from + 1; i < ids.length; i++) if (map.has(ids[i])) return i
  return ids.length
}

export function stepKind(entry) {
  return entry.type === 'rest' ? 'rest' : entry.type === 'cardio' ? 'cardio' : 'strength'
}

export function needsRestStart(entry) {
  return !!entry && entry.type === 'rest' && entry.status === 'planned' && entry.startedAt == null
}

// "Step 2 of 5" counts only steps that still exist.
export function progress(ids, entries, index) {
  const map = byId(entries)
  const live = ids.filter((id) => map.has(id))
  const here = ids[index]
  const position = here != null && map.has(here) ? live.indexOf(here) + 1 : live.length
  return { position, total: live.length }
}

// A step is done once it's logged; skipped ones are tracked by the run, not on
// the entry, so skipping never changes what's saved.
export function isStepDone(entry, skipped) {
  return !!entry && (entry.status === 'completed' || skipped.includes(entry.id))
}

export function summarizeRun(ids, entries, skipped) {
  const map = byId(entries)
  const live = ids.map((id) => map.get(id)).filter(Boolean)
  return {
    completed: live.filter((e) => e.status === 'completed'),
    skipped: live.filter((e) => e.status !== 'completed' && skipped.includes(e.id)),
    total: live.length,
  }
}

// Button label on the home screen.
export function runLabel(dayEntries) {
  const planned = dayEntries.filter((e) => e.status === 'planned').length
  if (planned === 0) return null
  return dayEntries.some((e) => e.status === 'completed') ? 'Resume workout' : 'Start workout'
}
