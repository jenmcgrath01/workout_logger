import { describe, it, expect } from 'vitest'
import { monthTicks, nearestIndex, niceTicks, relativeDay, scale } from './chart'

describe('scale', () => {
  it('maps the domain onto the range, including an inverted y axis', () => {
    const x = scale(0, 10, 0, 100)
    expect(x(0)).toBe(0)
    expect(x(5)).toBe(50)
    const y = scale(170, 220, 150, 0)
    expect(y(170)).toBe(150)
    expect(y(220)).toBe(0)
    expect(y(195)).toBe(75)
  })

  it('does not divide by zero for a flat domain', () => {
    expect(Number.isFinite(scale(5, 5, 0, 100)(5))).toBe(true)
  })
})

describe('niceTicks', () => {
  it('picks round steps that cover the data', () => {
    expect(niceTicks(176, 220, 4)).toEqual([160, 180, 200, 220])
    expect(niceTicks(176, 220, 5)).toEqual([170, 180, 190, 200, 210, 220])
    expect(niceTicks(0, 9.6, 4)).toEqual([0, 5, 10])
    expect(niceTicks(0, 9.6, 5)).toEqual([0, 2, 4, 6, 8, 10])
  })

  it('handles fractional steps without float noise', () => {
    expect(niceTicks(0, 1.4, 4)).toEqual([0, 0.5, 1, 1.5])
  })

  it('copes with a flat range', () => {
    expect(niceTicks(180, 180, 4).length).toBeGreaterThan(1)
  })
})

describe('monthTicks', () => {
  it('lists first-of-month dates inside the range with years on January and the first label', () => {
    const t = monthTicks('2025-10-15', '2026-03-20', 10)
    expect(t.map((x) => x.date)).toEqual(['2025-11-01', '2025-12-01', '2026-01-01', '2026-02-01', '2026-03-01'])
    expect(t.map((x) => x.label)).toEqual(["Nov '25", 'Dec', "Jan '26", 'Feb', 'Mar'])
  })

  it('thins out labels on a long range', () => {
    const t = monthTicks('2024-01-01', '2026-12-31', 6)
    expect(t.length).toBeLessThanOrEqual(6)
    expect(t.length).toBeGreaterThan(2)
  })

  it('returns nothing when the range contains no month start', () => {
    expect(monthTicks('2026-03-02', '2026-03-20')).toEqual([])
  })
})

describe('nearestIndex', () => {
  it('finds the closest position', () => {
    expect(nearestIndex([10, 50, 90], 60)).toBe(1)
    expect(nearestIndex([10, 50, 90], 85)).toBe(2)
    expect(nearestIndex([10, 50, 90], -5)).toBe(0)
    expect(nearestIndex([], 5)).toBe(-1)
  })
})

describe('relativeDay', () => {
  it('describes dates the way you would say them', () => {
    const today = '2026-10-13'
    expect(relativeDay('2026-10-13', today)).toBe('today')
    expect(relativeDay('2026-10-12', today)).toBe('yesterday')
    expect(relativeDay('2026-10-10', today)).toBe('3 days ago')
    expect(relativeDay('2026-09-22', today)).toBe('3 weeks ago')
    expect(relativeDay('2026-03-04', today)).toBe('7 months ago')
    // Under two years stays in months, so 19 months isn't rounded up to "2 years".
    expect(relativeDay('2025-03-04', today)).toBe('19 months ago')
    expect(relativeDay('2024-10-13', today)).toBe('2 years ago')
    expect(relativeDay('2026-10-20', today)).toBe('in 7 days')
    expect(relativeDay('2026-10-27', today)).toBe('in 2 weeks')
  })
})
