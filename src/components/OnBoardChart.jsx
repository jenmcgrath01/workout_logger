import { colorForDose, dayNumber, doseAt, onBoardSeries } from '../lib/health'
import { monthTicks, niceTicks, scale } from '../lib/chart'
import { fmtDate, useChartHover } from '../lib/useChartHover'

const W = 360
const H = 170
const M = { l: 38, r: 12, t: 12, b: 24 }

// Estimated GLP-1 still in your system. Each dose halves every `halfLifeDays`,
// so you get a sawtooth that climbs towards a steady level.
export default function OnBoardChart({ doses, halfLifeDays, events, startISO, endISO }) {
  const series = onBoardSeries(doses, startISO, endISO, halfLifeDays)
  const x = scale(dayNumber(startISO), dayNumber(endISO), M.l, W - M.r)
  const xs = series.map((s) => x(dayNumber(s.date)))
  const hover = useChartHover(W, xs)

  const ticks = niceTicks(0, Math.max(...series.map((s) => s.mg), 1), 4)
  const y = scale(ticks[0], ticks[ticks.length - 1], H - M.b, M.t)
  const baseline = y(0)

  const line = series.map((s, i) => `${xs[i]},${y(s.mg)}`).join(' ')
  const area = `${xs[0]},${baseline} ${line} ${xs[xs.length - 1]},${baseline}`
  const months = monthTicks(startISO, endISO, 5)
  const visibleDoses = doses.filter((d) => d.date >= startISO && d.date <= endISO)

  const h = hover.index
  const hs = h != null ? series[h] : null
  const hoverDose = hs ? doses.find((d) => d.date === hs.date) : null

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Estimated GLP-1 on board">
      <title>Estimated GLP-1 on board</title>

      {ticks.map((t) => (
        <g key={t}>
          <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="0.5" />
          <text x={M.l - 6} y={y(t) + 4} fontSize="11" textAnchor="end" fill="var(--text-dim)">
            {Number.isInteger(t) ? t : t.toFixed(1)}
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

      {events
        .filter((e) => e.date >= startISO && e.date <= endISO)
        .map((e) => (
          <line key={e.id} x1={x(dayNumber(e.date))} x2={x(dayNumber(e.date))} y1={M.t} y2={H - M.b} stroke="#BA7517" strokeWidth="1" strokeDasharray="3 3" />
        ))}

      <polygon points={area} fill="var(--accent)" fillOpacity="0.22" />
      <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinejoin="round" />
      {visibleDoses.length <= 60 &&
        visibleDoses.map((d) => (
          <circle key={d.id} cx={x(dayNumber(d.date))} cy={y(series.find((s) => s.date === d.date)?.mg ?? 0)} r="3" fill={colorForDose(d.mg)} stroke="var(--surface-2)" strokeWidth="1" />
        ))}

      {hs && (
        <g pointerEvents="none">
          <line x1={xs[h]} x2={xs[h]} y1={M.t} y2={H - M.b} stroke="var(--text-dim)" strokeWidth="1" />
          <circle cx={xs[h]} cy={y(hs.mg)} r="4.5" fill="var(--accent)" stroke="var(--surface-2)" strokeWidth="1.5" />
          <g transform={`translate(${xs[h] > W / 2 ? xs[h] - 142 : xs[h] + 8}, ${M.t + 4})`}>
            <rect width="134" height="56" rx="6" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="0.5" />
            <text x="8" y="16" fontSize="11" fill="var(--text-dim)">
              {fmtDate(hs.date)}
            </text>
            <text x="8" y="33" fontSize="13" fontWeight="500" fill="var(--text)">
              {hs.mg.toFixed(1)} mg on board
            </text>
            <text x="8" y="49" fontSize="11" fill="var(--text-dim)">
              {hoverDose ? `${hoverDose.mg} mg dose today` : `on ${doseAt(doses, hs.date) ?? '–'} mg`}
            </text>
          </g>
        </g>
      )}

      <rect x="0" y="0" width={W} height={H} fill="transparent" style={{ touchAction: 'pan-y' }} {...hover.handlers} />
    </svg>
  )
}
