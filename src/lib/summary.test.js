import { describe, it, expect } from 'vitest'
import { describeEntry } from './summary'

describe('describeEntry', () => {
  it('lists logged sets with weight and reps', () => {
    const d = describeEntry({
      type: 'strength', exerciseName: 'Dumbbell Bench Press', bodyweight: false, timed: false,
      sets: [{ actualWeight: 40, actualReps: 10 }, { actualWeight: 45, actualReps: 8 }],
    })
    expect(d).toEqual({ title: 'Dumbbell Bench Press', detail: '40 lbs × 10, 45 lbs × 8' })
  })

  it('shows reps only for bodyweight work', () => {
    const d = describeEntry({ type: 'strength', exerciseName: 'Pushups', bodyweight: true, sets: [{ actualReps: 15 }] })
    expect(d.detail).toBe('15 reps')
  })

  it('shows holds in their own unit', () => {
    const secs = describeEntry({ type: 'strength', exerciseName: 'Plank', bodyweight: true, timed: true, sets: [{ actualSeconds: 45 }] })
    expect(secs.detail).toBe('0:45')
    const mins = describeEntry({ type: 'strength', exerciseName: 'Hang', bodyweight: true, timed: true, timeUnit: 'minutes', sets: [{ actualSeconds: 120 }] })
    expect(mins.detail).toBe('2 min')
  })

  it('describes a rest by how long it actually ran', () => {
    expect(describeEntry({ type: 'rest', targetSeconds: 90, actualSeconds: 120 })).toEqual({ title: 'Rest', detail: '2:00' })
    expect(describeEntry({ type: 'rest', targetSeconds: 90, actualSeconds: null }).detail).toBe('1:30')
  })

  it('describes cardio with time and distance, or a dash when empty', () => {
    expect(describeEntry({ type: 'cardio', exerciseName: 'Run', actualMinutes: 32, actualMiles: 3.2 }).detail).toBe('32 min · 3.2 mi')
    expect(describeEntry({ type: 'cardio', exerciseName: 'Run', actualMinutes: null, actualMiles: null }).detail).toBe('—')
  })
})
