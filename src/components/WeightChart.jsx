import { colorForDose, dayNumber } from '../lib/health'
import { monthTicks, niceTicks, scale } from '../lib/chart'
import { fmtDate, useChartHover } from '../lib/useChartHover'

const W = 360
const H = 230
const M = { l: 38, r: 12, t: 38, b: 24 }
const EVENT_COLOR = '#BA7517'

const chipWidth = (text) => Math.round(text.length * 6.6 + 12)
const fmtTick = (t) => (Number.isInteger(t) ? String(t) : t.toFixed(1))

// Weight over time. The line takes the colour of the dose you were on, dose
// steps are labelled where they happen, and events (trips, illness) are dashed
// vertical markers. A thin dashed line shows the 7-entry average.
export default function WeightChart({ points, changes, events, startISO, endISO }) {
  const pts = points.filter((p) => p.date >= startISO && p.date <= endISO)
  const x = scale(dayNumber(startISO), dayNumber(endISO), M.l, W - M.r)
  const xs = pts.map((p) => x(dayNumber(p.date)))
  const hover = useChartHover(W, xs)

  if (pts.length === 0) return <p className="chart-empty">No weigh-ins in this range.</p>

  const values = pts.flatMap((p) => [p.weight, p.avg])
  const ticks = niceTicks(Math.min(...values), Math.max(...values), 5)
  const y = scale(ticks[0], ticks[ticks.length - 1], H - M.b, M.t)

  // Contiguous stretches of the same dose become one coloured polyline; the
  // segment into a new dose takes the new colour, so the step-up is visible.
  const runs = []
  pts.forEach((p, i) => {
    const color = colorForDose(p.dose)
    const pt = [xs[i], y(p.weight)]
    const last = runs[runs.length - 1]
    if (!last) runs.push({ color, pts: [pt] })
    else if (last.color === color) last.pts.push(pt)
    else runs.push({ color, pts: [last.pts[last.pts.length - 1], pt] })
  })

  const months = monthTicks(startISO, endISO, 5)
  // A dose chip sits above its point. If it would run into the previous chip
  // (doses only weeks apart), it drops below the line instead.
  let prevRight = -Infinity
  const doseChips = changes
    .filter((c) => c.date >= startISO && c.date <= endISO)
    .map((c) => {
      const label = `${c.dose} mg`
      const w = chipWidth(label)
      const cx = Math.min(Math.max(x(dayNumber(c.date)), M.l + w / 2), W - M.r - w / 2)
      const crowded = cx - w / 2 < prevRight + 3
      prevRight = crowded ? prevRight : cx + w / 2
      const cy = crowded ? Math.min(H - M.b - 10, y(c.weight) + 20) : Math.max(M.t + 6, y(c.weight) - 18)
      return { ...c, label, w, cx, cy }
    })

  // Event chips sit in two rows along the top so close-together ones don't overlap.
  const rows = [[], []]
  const eventChips = events
    .filter((e) => e.date >= startISO && e.date <= endISO)
    .map((e) => {
      const label = e.label.length > 14 ? `${e.label.slice(0, 13)}…` : e.label
      const w = chipWidth(label)
      const px = x(dayNumber(e.date))
      const cx = Math.min(Math.max(px, M.l + w / 2), W - M.r - w / 2)
      const free = (row) => rows[row].every((c) => cx - w / 2 > c.right + 3)
      const row = free(0) ? 0 : free(1) ? 1 : 0
      rows[row].push({ right: cx + w / 2 })
      return { ...e, label, w, px, cx, cy: 4 + row * 17 }
    })

  const h = hover.index
  const hp = h != null ? pts[h] : null

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Weight over time, coloured by dose">
      <title>Weight over time, coloured by dose</title>

      {ticks.map((t) => (
        <g key={t}>
          <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="0.5" />
          <text x={M.l - 6} y={y(t) + 4} fontSize="11" textAnchor="end" fill="var(--text-dim)">
            {fmtTick(t)}
          </text>
        </g>
      ))}
      {months.map((m, i) => (
        <g key={m.date}>
          <line x1={x(dayNumber(m.date))} x2={x(dayNumber(m.date))} y1={M.t} y2={H - M.b} stroke="var(--border)" strokeWidth="0.5" />
          <text
            x={x(dayNumber(m.date))}
            y={H - 7}
            fontSize="11"
            textAnchor={i === 0 && x(dayNumber(m.date)) < M.l + 24 ? 'start' : 'middle'}
            fill="var(--text-dim)"
          >
            {m.label}
          </text>
        </g>
      ))}

      {eventChips.map((e) => (
        <line key={`l${e.id}`} x1={e.px} x2={e.px} y1={e.cy + 14} y2={H - M.b} stroke={EVENT_COLOR} strokeWidth="1" strokeDasharray="3 3" />
      ))}

      {pts.length >= 3 && (
        <polyline
          points={pts.map((p, i) => `${xs[i]},${y(p.avg)}`).join(' ')}
          fill="none"
          stroke="var(--text-dim)"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
      )}

      {runs.map((r, i) =>
        r.pts.length > 1 ? (
          <polyline key={i} points={r.pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={r.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <circle key={i} cx={r.pts[0][0]} cy={r.pts[0][1]} r="3.5" fill={r.color} />
        )
      )}
      {pts.length <= 70 &&
        pts.map((p, i) => (
          <circle key={p.id} cx={xs[i]} cy={y(p.weight)} r="2.6" fill="var(--surface-2)" stroke={colorForDose(p.dose)} strokeWidth="1.5" />
        ))}

      {doseChips.map((c) => (
        <g key={c.date}>
          <rect x={c.cx - c.w / 2} y={c.cy - 8} width={c.w} height="16" rx="4" fill={colorForDose(c.dose)} />
          <text x={c.cx} y={c.cy + 4} fontSize="11" textAnchor="middle" fill="#fff">
            {c.label}
          </text>
        </g>
      ))}
      {eventChips.map((e) => (
        <g key={e.id}>
          <rect x={e.cx - e.w / 2} y={e.cy} width={e.w} height="15" rx="4" fill={EVENT_COLOR} />
          <text x={e.cx} y={e.cy + 11} fontSize="11" textAnchor="middle" fill="#fff">
            {e.label}
          </text>
        </g>
      ))}

      {hp && (
        <g pointerEvents="none">
          <line x1={xs[h]} x2={xs[h]} y1={M.t} y2={H - M.b} stroke="var(--text-dim)" strokeWidth="1" />
          <circle cx={xs[h]} cy={y(hp.weight)} r="5" fill={colorForDose(hp.dose)} stroke="var(--surface-2)" strokeWidth="1.5" />
          <g transform={`translate(${xs[h] > W / 2 ? xs[h] - 142 : xs[h] + 8}, ${M.t + 6})`}>
            <rect width="134" height="56" rx="6" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="0.5" />
            <text x="8" y="16" fontSize="11" fill="var(--text-dim)">
              {fmtDate(hp.date)}
            </text>
            <text x="8" y="33" fontSize="13" fontWeight="500" fill="var(--text)">
              {hp.weight} lb
            </text>
            <text x="8" y="49" fontSize="11" fill="var(--text-dim)">
              {hp.dose != null ? `${hp.dose} mg` : 'no dose yet'} · avg {hp.avg.toFixed(1)}
            </text>
          </g>
        </g>
      )}

      <rect x="0" y="0" width={W} height={H} fill="transparent" style={{ touchAction: 'pan-y' }} {...hover.handlers} />
    </svg>
  )
}
