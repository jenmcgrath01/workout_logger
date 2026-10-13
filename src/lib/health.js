import { uuid } from './storage'

// Weight, GLP-1 doses and life events ("trip", "sick"). Kept apart from
// workout entries and keyed by date, so any of it can be logged for a past day.
const STORAGE_KEY = 'workout-tracker-health'
const MS_DAY = 86400000

export const DEFAULT_HALF_LIFE_DAYS = 7
// Tirzepatide steps; matches the usual 2.5 mg ladder. Any other amount can be
// typed in.
export const DOSE_PRESETS = [2.5, 5, 7.5, 10, 12.5, 15]

export const EMPTY_HEALTH = { weights: [], doses: [], events: [], settings: { halfLifeDays: DEFAULT_HALF_LIFE_DAYS } }

export function loadHealth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(EMPTY_HEALTH)
    const p = JSON.parse(raw)
    return {
      weights: Array.isArray(p.weights) ? p.weights : [],
      doses: Array.isArray(p.doses) ? p.doses : [],
      events: Array.isArray(p.events) ? p.events : [],
      settings: { halfLifeDays: DEFAULT_HALF_LIFE_DAYS, ...p.settings },
    }
  } catch {
    return structuredClone(EMPTY_HEALTH)
  }
}

export function saveHealth(h) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(h))
}

// ---- Dates: whole days, timezone-proof ----

export function dayNumber(dateISO) {
  const [y, m, d] = dateISO.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / MS_DAY)
}

export function isoFromDay(n) {
  return new Date(n * MS_DAY).toISOString().slice(0, 10)
}

export function addDaysISO(dateISO, delta) {
  return isoFromDay(dayNumber(dateISO) + delta)
}

const byDate = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)

// ---- Edits: each returns a new object (and the caller saves it) ----

// One weigh-in per day: logging the same date again replaces it.
export function upsertWeight(h, { date, weight }) {
  const rest = h.weights.filter((w) => w.date !== date)
  return { ...h, weights: [...rest, { id: uuid(), date, weight: Number(weight) }].sort(byDate) }
}

// One dose per day as well.
export function upsertDose(h, { date, mg }) {
  const rest = h.doses.filter((d) => d.date !== date)
  return { ...h, doses: [...rest, { id: uuid(), date, mg: Number(mg) }].sort(byDate) }
}

export function addEvent(h, { date, label }) {
  return { ...h, events: [...h.events, { id: uuid(), date, label: label.trim() }].sort(byDate) }
}

export function deleteItem(h, kind, id) {
  return { ...h, [kind]: h[kind].filter((x) => x.id !== id) }
}

export function setHalfLife(h, days) {
  const n = Number(days)
  return { ...h, settings: { ...h.settings, halfLifeDays: n > 0 ? n : DEFAULT_HALF_LIFE_DAYS } }
}

// ---- GLP-1 on board ----

// Each dose halves every `halfLifeDays`. A dose counts in full on the day it's
// taken. This is a simple decay estimate (no absorption ramp), so it is a
// guide to the shape, not a clinical level.
export function onBoard(doses, dateISO, halfLifeDays = DEFAULT_HALF_LIFE_DAYS) {
  const t = dayNumber(dateISO)
  let total = 0
  for (const d of doses) {
    const age = t - dayNumber(d.date)
    if (age >= 0) total += d.mg * Math.pow(0.5, age / halfLifeDays)
  }
  return total
}

export function onBoardSeries(doses, fromISO, toISO, halfLifeDays = DEFAULT_HALF_LIFE_DAYS) {
  const out = []
  for (let n = dayNumber(fromISO); n <= dayNumber(toISO); n++) {
    const date = isoFromDay(n)
    out.push({ date, mg: onBoard(doses, date, halfLifeDays) })
  }
  return out
}

// The dose level in force on a date: the most recent dose on or before it.
export function doseAt(doses, dateISO) {
  let level = null
  let latest = ''
  for (const d of doses) {
    if (d.date <= dateISO && d.date >= latest) {
      latest = d.date
      level = d.mg
    }
  }
  return level
}

// ---- Weight series ----

// Average of the last `window` entries (including this one) — smooths the
// day-to-day water and salt noise so a plateau is easier to see.
export function movingAverage(weights, window = 7) {
  return weights.map((_, i) => {
    const slice = weights.slice(Math.max(0, i - window + 1), i + 1)
    return slice.reduce((a, w) => a + w.weight, 0) / slice.length
  })
}

export function weightPoints(h, window = 7) {
  const sorted = [...h.weights].sort(byDate)
  const avg = movingAverage(sorted, window)
  return sorted.map((w, i) => ({ ...w, dose: doseAt(h.doses, w.date), avg: avg[i] }))
}

// Dose values each point steps up (or down) to, for the labelled chips.
export function doseChanges(points) {
  const out = []
  let prev
  for (const p of points) {
    if (p.dose != null && p.dose !== prev) out.push({ date: p.date, dose: p.dose, weight: p.weight })
    prev = p.dose
  }
  return out
}

// Fixed colours for the usual ladder (gray, purple, teal, pink, blue, red, as
// in the reference chart); anything else gets a stable colour from its value.
const LADDER = { 2.5: '#888780', 5: '#7F77DD', 7.5: '#1D9E75', 10: '#D4537E', 12.5: '#378ADD', 15: '#E24B4A' }
const EXTRA = ['#BA7517', '#639922', '#D85A30', '#534AB7']
export function colorForDose(mg) {
  if (mg == null) return '#888780'
  if (LADDER[mg]) return LADDER[mg]
  return EXTRA[Math.abs(Math.round(mg * 100)) % EXTRA.length]
}

// ---- Ranges ----

export const RANGES = [
  { key: '3M', days: 91 },
  { key: '6M', days: 182 },
  { key: '1Y', days: 365 },
  { key: 'All', days: null },
]

export function rangeStartISO(range, todayISO, firstISO) {
  const r = RANGES.find((x) => x.key === range)
  if (!r || r.days == null) return firstISO ?? todayISO
  const start = addDaysISO(todayISO, -r.days)
  return firstISO && firstISO > start ? firstISO : start
}

// ---- Home-card / header summary ----

export function summarize(h, todayISO) {
  const weights = [...h.weights].sort(byDate)
  const latest = weights[weights.length - 1] ?? null
  const first = weights[0] ?? null
  const lastDose = [...h.doses].sort(byDate).filter((d) => d.date <= todayISO).pop() ?? null
  return {
    hasData: weights.length > 0 || h.doses.length > 0,
    latestWeight: latest?.weight ?? null,
    latestWeightDate: latest?.date ?? null,
    changeSinceStart: latest && first && latest !== first ? latest.weight - first.weight : null,
    onBoardNow: h.doses.length ? onBoard(h.doses, todayISO, h.settings.halfLifeDays) : null,
    currentDose: lastDose?.mg ?? null,
    lastDoseDate: lastDose?.date ?? null,
  }
}
