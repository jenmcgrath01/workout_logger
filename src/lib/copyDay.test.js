import { describe, it, expect } from 'vitest'
import { copyDay, findLastThemeDay } from './copyDay'

const set = (o) => ({
  targetWeight: null, targetReps: null, targetSeconds: null,
  actualWeight: null, actualReps: null, actualSeconds: null, ...o,
})

const completedBench = {
  id: 'a', date: '2026-10-06', type: 'strength', status: 'completed', exerciseName: 'Bench Press',
  bodyweight: false, timed: false, notes: 'felt heavy',
  sets: [set({ targetWeight: 135, targetReps: 10, actualWeight: 140, actualReps: 9 })],
}

describe('copyDay', () => {
  it('turns last actuals into new targets and clears actuals', () => {
    const [copy] = copyDay([completedBench], '2026-10-06', '2026-10-13')
    expect(copy.sets[0]).toMatchObject({ targetWeight: 140, targetReps: 9, actualWeight: null, actualReps: null })
  })

  it('falls back to the old target when nothing was logged', () => {
    const planned = { ...completedBench, status: 'planned', sets: [set({ targetWeight: 135, targetReps: 10 })] }
    const [copy] = copyDay([planned], '2026-10-06', '2026-10-13')
    expect(copy.sets[0]).toMatchObject({ targetWeight: 135, targetReps: 10 })
  })

  it('re-dates, resets status, drops notes and the id', () => {
    const [copy] = copyDay([completedBench], '2026-10-06', '2026-10-13')
    expect(copy).toMatchObject({ date: '2026-10-13', status: 'planned', notes: '' })
    expect(copy.id).toBeUndefined()
  })

  it('keeps bodyweight and timed flags', () => {
    const plank = { ...completedBench, exerciseName: 'Plank', bodyweight: true, timed: true,
      sets: [set({ targetSeconds: 30, actualSeconds: 45 })] }
    const [copy] = copyDay([plank], '2026-10-06', '2026-10-13')
    expect(copy).toMatchObject({ bodyweight: true, timed: true })
    expect(copy.sets[0].targetSeconds).toBe(45)
  })

  it('keeps a hold\'s time unit and beep setting', () => {
    const hang = { ...completedBench, exerciseName: 'Dead hang', bodyweight: true, timed: true,
      timeUnit: 'minutes', enableBeeps: false, sets: [set({ targetSeconds: 120, actualSeconds: 180 })] }
    const [copy] = copyDay([hang], '2026-10-06', '2026-10-13')
    expect(copy).toMatchObject({ timeUnit: 'minutes', enableBeeps: false })
    expect(copy.sets[0].targetSeconds).toBe(180)
  })

  it('defaults older entries to seconds with beeps on', () => {
    const [copy] = copyDay([completedBench], '2026-10-06', '2026-10-13')
    expect(copy).toMatchObject({ timeUnit: 'seconds', enableBeeps: true })
  })

  it('resets a rest that was started or finished', () => {
    const rest = { id: 'r', date: '2026-10-06', type: 'rest', status: 'completed', targetSeconds: 90, actualSeconds: 120, startedAt: 123 }
    const [copy] = copyDay([rest], '2026-10-06', '2026-10-13')
    expect(copy).toMatchObject({ type: 'rest', status: 'planned', targetSeconds: 90, actualSeconds: null, startedAt: null })
  })

  it('carries cardio actuals forward as targets', () => {
    const run = { id: 'c', date: '2026-10-06', type: 'cardio', status: 'completed', exerciseName: 'Run',
      targetMinutes: 90, targetMiles: 6.5, actualMinutes: 95, actualMiles: 6.7 }
    const [copy] = copyDay([run], '2026-10-06', '2026-10-13')
    expect(copy).toMatchObject({ targetMinutes: 95, targetMiles: 6.7, actualMinutes: null, actualMiles: null })
  })

  it('preserves the original order and ignores other days', () => {
    const other = { ...completedBench, id: 'x', date: '2026-10-07', exerciseName: 'Squat' }
    const rest = { id: 'r', date: '2026-10-06', type: 'rest', status: 'planned', targetSeconds: 60 }
    const out = copyDay([completedBench, other, rest], '2026-10-06', '2026-10-13')
    expect(out.map((e) => e.exerciseName ?? e.type)).toEqual(['Bench Press', 'rest'])
  })

  it('returns nothing for an empty day', () => {
    expect(copyDay([completedBench], '2026-01-01', '2026-10-13')).toEqual([])
  })
})

describe('findLastThemeDay', () => {
  const themes = { '2026-10-01': 'Upper body', '2026-10-03': 'Cardio', '2026-10-06': 'upper body ', '2026-10-20': 'Upper body' }
  const entries = [{ date: '2026-10-01' }, { date: '2026-10-06' }, { date: '2026-10-20' }]

  it('finds the latest earlier day with that theme, ignoring case and spacing', () => {
    expect(findLastThemeDay(themes, 'Upper body', '2026-10-13', entries)).toBe('2026-10-06')
  })

  it('never returns the target date or a later one', () => {
    expect(findLastThemeDay(themes, 'Upper body', '2026-10-06', entries)).toBe('2026-10-01')
  })

  it('skips themed days that have no entries', () => {
    expect(findLastThemeDay(themes, 'Cardio', '2026-10-13', entries)).toBeNull()
  })

  it('returns null for a blank theme', () => {
    expect(findLastThemeDay(themes, '', '2026-10-13', entries)).toBeNull()
  })
})
