import { describe, it, expect } from 'vitest'
import { draftFromName, lastTimeFor } from './draft'

const set = (o) => ({
  targetWeight: null, targetReps: null, targetSeconds: null,
  actualWeight: null, actualReps: null, actualSeconds: null, ...o,
})
const bench = (o) => ({
  id: Math.random().toString(), type: 'strength', exerciseName: 'Bench Press', status: 'completed',
  date: '2026-10-01', bodyweight: false, timed: false, notes: '', sets: [set({ actualWeight: 135, actualReps: 10 })], ...o,
})

describe('lastTimeFor', () => {
  it('matches names ignoring case and surrounding spaces', () => {
    expect(lastTimeFor('  bench PRESS ', [bench()])).not.toBeNull()
  })

  it('prefers the most recent completed session', () => {
    const older = bench({ date: '2026-09-01' })
    const newer = bench({ date: '2026-10-05', sets: [set({ actualWeight: 145, actualReps: 8 })] })
    expect(lastTimeFor('Bench Press', [newer, older]).date).toBe('2026-10-05')
  })

  it('prefers a completed session over a newer planned one', () => {
    const done = bench({ date: '2026-10-01' })
    const planned = bench({ date: '2026-11-01', status: 'planned' })
    expect(lastTimeFor('Bench Press', [done, planned]).status).toBe('completed')
  })

  it('falls back to a planned session when none are completed', () => {
    expect(lastTimeFor('Bench Press', [bench({ status: 'planned' })]).status).toBe('planned')
  })

  it('ignores rest and cardio entries and other names', () => {
    expect(lastTimeFor('Bench Press', [{ type: 'cardio', exerciseName: 'Bench Press', date: 'x' }, bench({ exerciseName: 'Squat' })])).toBeNull()
  })

  it('returns null for an empty name', () => {
    expect(lastTimeFor('', [bench()])).toBeNull()
  })
})

describe('draftFromName', () => {
  it('reuses last time as targets, with the original casing', () => {
    const d = draftFromName('bench press', [bench()])
    expect(d.exerciseName).toBe('Bench Press')
    expect(d.sets[0]).toMatchObject({ targetWeight: 135, targetReps: 10, actualWeight: null })
    expect(d.fromDate).toBe('2026-10-01')
  })

  it('remembers the bodyweight and timed flags', () => {
    const plank = bench({ exerciseName: 'Plank', bodyweight: true, timed: true, sets: [set({ actualSeconds: 40 })] })
    const d = draftFromName('Plank', [plank])
    expect(d).toMatchObject({ bodyweight: true, timed: true })
    expect(d.sets[0].targetSeconds).toBe(40)
  })

  it('falls back to three blank sets for an unknown exercise', () => {
    const d = draftFromName('  Dead hang ', [])
    expect(d.exerciseName).toBe('Dead hang')
    expect(d.sets).toHaveLength(3)
    expect(d.fromDate).toBeNull()
    expect(d.timed).toBe(false)
  })

  it('applies caller defaults, and a 30s target for timed holds', () => {
    const d = draftFromName('Dead hang', [], { timed: true, bodyweight: true })
    expect(d).toMatchObject({ timed: true, bodyweight: true })
    expect(d.sets.every((s) => s.targetSeconds === 30)).toBe(true)
  })
})
