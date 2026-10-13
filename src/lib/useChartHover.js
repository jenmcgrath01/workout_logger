import { useState } from 'react'
import { nearestIndex } from './chart'

// Tap or drag across a chart to inspect the nearest point. `width` is the
// SVG's viewBox width, so pointer positions can be mapped into chart space.
export function useChartHover(width, xs) {
  const [index, setIndex] = useState(null)

  const move = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (width / rect.width)
    const i = nearestIndex(xs, x)
    setIndex(i === -1 ? null : i)
  }

  return {
    index,
    clear: () => setIndex(null),
    // A mouse leaving clears the readout; a finger lifting leaves it showing.
    handlers: { onPointerMove: move, onPointerDown: move, onPointerLeave: (e) => e.pointerType === 'mouse' && setIndex(null) },
  }
}

export function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
