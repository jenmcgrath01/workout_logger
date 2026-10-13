import { describe, it, expect } from 'vitest'
import {
  addDaysISO, addEvent, colorForDose, dayNumber, deleteItem, doseAt, doseChanges, EMPTY_HEALTH, isoFromDay, movingAverage,
  onBoard, onBoardSeries, rangeStartISO, setHalfLife, summarize, upsertDose, upsertWeight, weightPoints,
} from './health'

const h0 = () => structuredClone(EMPTY_HEALTH)

describe('dates', () => {
  it('round-trips and does whole-day arithmetic without timezone drift', () => {
    expect(isoFromDay(dayNumber('2026-10-13'))).toBe('2026-10-13')
    expect(addDaysISO('2026-10-13', 7)).toBe('2026-10-20')
    expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDaysISO('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01')
  })
})

describe('onBoard (7 day half-life)', () => {
  const doses = [{ date: '2026-01-01', mg: 5 }]

  it('is zero before the first dose', () => {
    expect(onBoard(doses, '2025-12-31')).toBe(0)
  })

  it('counts a dose in full on the day it is taken', () => {
    expect(onBoard(doses, '2026-01-01')).toBe(5)
  })

  it('halves every 7 days', () => {
    expect(onBoard(doses, '2026-01-08')).toBeCloseTo(2.5, 10)
    expect(onBoard(doses, '2026-01-15')).toBeCloseTo(1.25, 10)
    expect(onBoard(doses, '2026-01-22')).toBeCloseTo(0.625, 10)
  })

  it('decays smoothly in between', () => {
    expect(onBoard(doses, '2026-01-02')).toBeCloseTo(5 * Math.pow(0.5, 1 / 7), 10)
  })

  it('adds doses together', () => {
    const two = [...doses, { date: '2026-01-08', mg: 5 }]
    expect(onBoard(two, '2026-01-08')).toBeCloseTo(7.5, 10)
  })

  it('builds towards twice the weekly dose, the steady state for a 7 day half-life', () => {
    const weekly = Array.from({ length: 14 }, (_, i) => ({ date: addDaysISO('2026-01-01', i * 7), mg: 5 }))
    expect(onBoard(weekly, weekly[13].date)).toBeCloseTo(10, 2)
  })

  it('respects a different half-life', () => {
    expect(onBoard(doses, '2026-01-06', 5)).toBeCloseTo(2.5, 10)
  })

  it('ignores doses in the future', () => {
    expect(onBoard([{ date: '2026-02-01', mg: 5 }], '2026-01-01')).toBe(0)
  })
})

describe('onBoardSeries', () => {
  it('gives one point per day, inclusive, with a sawtooth at each dose', () => {
    const doses = [{ date: '2026-01-01', mg: 5 }, { date: '2026-01-08', mg: 5 }]
    const s = onBoardSeries(doses, '2026-01-01', '2026-01-09')
    expect(s).toHaveLength(9)
    expect(s[0].date).toBe('2026-01-01')
    expect(s[8].date).toBe('2026-01-09')
    expect(s[7].mg).toBeGreaterThan(s[6].mg)
    expect(s[6].mg).toBeLessThan(s[0].mg)
  })
})

describe('doseAt', () => {
  const doses = [{ date: '2026-01-01', mg: 2.5 }, { date: '2026-02-01', mg: 5 }]

  it('is the most recent dose on or before the date', () => {
    expect(doseAt(doses, '2026-01-15')).toBe(2.5)
    expect(doseAt(doses, '2026-02-01')).toBe(5)
    expect(doseAt(doses, '2026-06-01')).toBe(5)
  })

  it('is null before any dose', () => {
    expect(doseAt(doses, '2025-12-31')).toBeNull()
    expect(doseAt([], '2026-01-01')).toBeNull()
  })

  it('does not depend on the order doses were entered', () => {
    expect(doseAt([...doses].reverse(), '2026-01-15')).toBe(2.5)
  })
})

describe('edits', () => {
  it('keeps weights sorted and replaces the same day', () => {
    let h = upsertWeight(h0(), { date: '2026-03-02', weight: 200 })
    h = upsertWeight(h, { date: '2026-03-01', weight: 201 })
    h = upsertWeight(h, { date: '2026-03-02', weight: 199.5 })
    expect(h.weights.map((w) => [w.date, w.weight])).toEqual([['2026-03-01', 201], ['2026-03-02', 199.5]])
  })

  it('stores numbers even when given strings', () => {
    expect(upsertWeight(h0(), { date: '2026-03-01', weight: '182.4' }).weights[0].weight).toBe(182.4)
    expect(upsertDose(h0(), { date: '2026-03-01', mg: '2.5' }).doses[0].mg).toBe(2.5)
  })

  it('allows backdating: entries land in date order whenever they are added', () => {
    let h = upsertDose(h0(), { date: '2026-05-01', mg: 5 })
    h = upsertDose(h, { date: '2025-11-01', mg: 2.5 })
    expect(h.doses.map((d) => d.date)).toEqual(['2025-11-01', '2026-05-01'])
  })

  it('adds events and trims their label', () => {
    expect(addEvent(h0(), { date: '2026-03-01', label: '  Trip  ' }).events[0].label).toBe('Trip')
  })

  it('deletes by id and leaves the rest', () => {
    let h = upsertWeight(h0(), { date: '2026-03-01', weight: 200 })
    h = upsertWeight(h, { date: '2026-03-02', weight: 199 })
    const gone = h.weights[0].id
    expect(deleteItem(h, 'weights', gone).weights.map((w) => w.date)).toEqual(['2026-03-02'])
  })

  it('does not mutate its input', () => {
    const h = h0()
    upsertWeight(h, { date: '2026-03-01', weight: 200 })
    expect(h.weights).toEqual([])
  })

  it('ignores a nonsense half-life', () => {
    expect(setHalfLife(h0(), 5).settings.halfLifeDays).toBe(5)
    expect(setHalfLife(h0(), 0).settings.halfLifeDays).toBe(7)
    expect(setHalfLife(h0(), 'abc').settings.halfLifeDays).toBe(7)
  })
})

describe('movingAverage and weightPoints', () => {
  it('averages the last N entries, using fewer at the start', () => {
    const w = [200, 198, 202, 200].map((weight) => ({ weight }))
    expect(movingAverage(w, 3)).toEqual([200, 199, 200, 200])
  })

  it('attaches the dose in force and the average to each weigh-in', () => {
    let h = upsertDose(h0(), { date: '2026-01-01', mg: 2.5 })
    h = upsertDose(h, { date: '2026-02-01', mg: 5 })
    h = upsertWeight(h, { date: '2026-01-10', weight: 200 })
    h = upsertWeight(h, { date: '2026-02-10', weight: 190 })
    const p = weightPoints(h)
    expect(p.map((x) => x.dose)).toEqual([2.5, 5])
    expect(p[1].avg).toBe(195)
  })

  it('reports where the dose steps, for the labelled chips', () => {
    const pts = [
      { date: 'a', dose: 2.5, weight: 1 }, { date: 'b', dose: 2.5, weight: 1 },
      { date: 'c', dose: 5, weight: 1 }, { date: 'd', dose: 5, weight: 1 }, { date: 'e', dose: 7.5, weight: 1 },
    ]
    expect(doseChanges(pts).map((c) => [c.date, c.dose])).toEqual([['a', 2.5], ['c', 5], ['e', 7.5]])
  })
})

describe('colorForDose', () => {
  it('uses fixed colours for the usual ladder and is stable for anything else', () => {
    expect(colorForDose(2.5)).toBe('#888780')
    expect(colorForDose(15)).toBe('#E24B4A')
    expect(colorForDose(3)).toBe(colorForDose(3))
  })
})

describe('rangeStartISO', () => {
  it('goes back the right number of days, but never before your first entry', () => {
    expect(rangeStartISO('3M', '2026-10-13', '2025-01-01')).toBe(addDaysISO('2026-10-13', -91))
    expect(rangeStartISO('3M', '2026-10-13', '2026-09-01')).toBe('2026-09-01')
    expect(rangeStartISO('All', '2026-10-13', '2025-01-01')).toBe('2025-01-01')
    expect(rangeStartISO('All', '2026-10-13', null)).toBe('2026-10-13')
  })
})

describe('summarize', () => {
  it('reports nothing for an empty history', () => {
    expect(summarize(h0(), '2026-10-13')).toMatchObject({ hasData: false, latestWeight: null, onBoardNow: null, currentDose: null })
  })

  it('reports latest weight, change since the first weigh-in, and current dose', () => {
    let h = upsertWeight(h0(), { date: '2026-01-01', weight: 220 })
    h = upsertWeight(h, { date: '2026-10-01', weight: 182.4 })
    h = upsertDose(h, { date: '2026-10-06', mg: 12.5 })
    const s = summarize(h, '2026-10-13')
    expect(s.latestWeight).toBe(182.4)
    expect(s.changeSinceStart).toBeCloseTo(-37.6, 10)
    expect(s.currentDose).toBe(12.5)
    expect(s.lastDoseDate).toBe('2026-10-06')
    expect(s.onBoardNow).toBeCloseTo(6.25, 10)
  })

  it('has no change with a single weigh-in', () => {
    expect(summarize(upsertWeight(h0(), { date: '2026-01-01', weight: 220 }), '2026-10-13').changeSinceStart).toBeNull()
  })

  it('does not count a dose dated in the future as the current dose', () => {
    const h = upsertDose(h0(), { date: '2026-12-01', mg: 5 })
    expect(summarize(h, '2026-10-13').currentDose).toBeNull()
  })
})
