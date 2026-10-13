import { dayNumber, isoFromDay } from './health'

// Linear scale: maps a value in [d0, d1] onto [r0, r1].
export function scale(d0, d1, r0, r1) {
  const span = d1 - d0 || 1
  return (v) => r0 + ((v - d0) / span) * (r1 - r0)
}

// "Nice" axis values (1, 2, 5 x a power of ten) covering [min, max].
export function niceTicks(min, max, count = 4) {
  let lo = min
  let hi = max
  if (lo === hi) {
    lo -= 1
    hi += 1
  }
  const rough = (hi - lo) / count
  const pow = Math.pow(10, Math.floor(Math.log10(rough)))
  const frac = rough / pow
  const step = (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10) * pow
  const first = Math.floor(lo / step)
  const last = Math.ceil(hi / step)
  const ticks = []
  for (let i = first; i <= last; i++) ticks.push(Math.round(i * step * 1e6) / 1e6)
  return ticks
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// First-of-month tick marks between two dates, thinned so there are at most
// `maxLabels` of them. The year (as '26) is shown on January and on the first label.
export function monthTicks(startISO, endISO, maxLabels = 5) {
  const [sy, sm] = startISO.split('-').map(Number)
  const [ey, em] = endISO.split('-').map(Number)
  const all = []
  for (let y = sy, m = sm; y < ey || (y === ey && m <= em); m === 12 ? (y++, (m = 1)) : m++) {
    const date = `${y}-${String(m).padStart(2, '0')}-01`
    if (date >= startISO && date <= endISO) all.push({ date, month: m, year: y })
  }
  const step = Math.max(1, Math.ceil(all.length / maxLabels))
  return all
    .filter((_, i) => i % step === 0)
    .map((t, i) => ({
      date: t.date,
      label: i === 0 || t.month === 1 ? `${MONTHS[t.month - 1]} '${String(t.year).slice(2)}` : MONTHS[t.month - 1],
    }))
}

// Index of the entry in a sorted list of x positions closest to `x`.
export function nearestIndex(xs, x) {
  if (!xs.length) return -1
  let best = 0
  for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i
  return best
}

// "7 months ago", "3 weeks ago", "today", "in 2 days" — a sanity check shown
// next to a date field when logging something from the past.
export function relativeDay(dateISO, todayISO) {
  const diff = dayNumber(todayISO) - dayNumber(dateISO)
  if (diff === 0) return 'today'
  if (diff === 1) return 'yesterday'
  if (diff === -1) return 'tomorrow'
  const n = Math.abs(diff)
  const unit = n >= 730 ? [Math.round(n / 365), 'year'] : n >= 60 ? [Math.round(n / 30.4), 'month'] : n >= 14 ? [Math.round(n / 7), 'week'] : [n, 'day']
  const text = `${unit[0]} ${unit[1]}${unit[0] === 1 ? '' : 's'}`
  return diff > 0 ? `${text} ago` : `in ${text}`
}

export { isoFromDay }
