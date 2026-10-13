import { describe, it, expect } from 'vitest'
import { itemToEntry, parseQuickAdd, parseSpec, resolveItemAs, summarizeSets } from './quickAdd'

const parse = (text, ctx) => parseQuickAdd(text, ctx).items
const first = (text, ctx) => parse(text, ctx)[0]
const weights = (item) => item.sets.map((s) => s.targetWeight)
const reps = (item) => item.sets.map((s) => s.targetReps)

describe('sets and reps', () => {
  it('reads "3 sets of 10 at 135"', () => {
    const it = first('bench press 3 sets of 10 at 135')
    expect(it.name).toBe('Barbell Bench Press - Medium Grip')
    expect(reps(it)).toEqual([10, 10, 10])
    expect(weights(it)).toEqual([135, 135, 135])
  })

  it('reads the "3x10" and "3 by 10" shorthands', () => {
    for (const t of ['bench press 3x10 at 135', 'bench press 3 x 10 at 135', 'bench press 3 by 10 at 135', 'bench press 3 times 10 at 135']) {
      const it = first(t)
      expect([reps(it), weights(it)], t).toEqual([[10, 10, 10], [135, 135, 135]])
    }
  })

  it('reads spoken number words', () => {
    const it = first('bench press three sets of ten at one thirty five')
    expect(reps(it)).toEqual([10, 10, 10])
    expect(weights(it)).toEqual([135, 135, 135])
  })

  it('reads "one hundred thirty five" and "forty five"', () => {
    expect(weights(first('squat 1 set of 5 at one hundred thirty five'))).toEqual([135])
    expect(weights(first('squat 1 set of 5 at forty five'))).toEqual([45])
  })

  it('reads a pyramid written "185 for 5 205 for 5"', () => {
    const it = first('squat 185 for 5 205 for 5')
    expect(weights(it)).toEqual([185, 205])
    expect(reps(it)).toEqual([5, 5])
  })

  it('reads a pyramid written "185 x 5, 205 x 5"', () => {
    const it = first('squat 185 x 5, 205 x 5')
    expect(weights(it)).toEqual([185, 205])
  })

  it('reads sets-by-reps with the weight last', () => {
    const it = first('squat 5 x 5 at 185')
    expect(reps(it)).toEqual([5, 5, 5, 5, 5])
    expect(weights(it)).toEqual([185, 185, 185, 185, 185])
  })

  it('reads a single heavy set written weight x reps', () => {
    const it = first('squat 225 x 3')
    expect([weights(it), reps(it)]).toEqual([[225], [3]])
  })

  it('reads sets with no weight', () => {
    expect(weights(first('pullups 3 sets of 8'))).toEqual([null, null, null])
  })

  it('treats a lone number as a rep count', () => {
    expect(reps(first('pushups 20'))).toEqual([20])
  })

  it('reads decimals', () => {
    expect(weights(first('curl 3 sets of 10 at 22.5'))).toEqual([22.5, 22.5, 22.5])
  })
})

describe('timed holds', () => {
  it('reads seconds and minutes', () => {
    const s = first('plank 30 seconds')
    expect(s).toMatchObject({ timed: true, timeUnit: 'seconds' })
    expect(s.sets[0].targetSeconds).toBe(30)
    const m = first('plank 2 minutes')
    expect(m).toMatchObject({ timed: true, timeUnit: 'minutes' })
    expect(m.sets[0].targetSeconds).toBe(120)
  })

  it('treats a timed hold with no weight as bodyweight', () => {
    expect(first('dead hang 30 seconds').bodyweight).toBe(true)
  })

  it('reads several timed sets', () => {
    const it = first('plank 3 sets of 30 seconds')
    expect(it.sets).toHaveLength(3)
    expect(it.sets.every((s) => s.targetSeconds === 30)).toBe(true)
  })
})

describe('rest and cardio', () => {
  it('reads rest durations', () => {
    expect(first('rest 90 seconds').seconds).toBe(90)
    expect(first('rest two minutes').seconds).toBe(120)
    expect(first('rest 90').seconds).toBe(90)
    expect(first('rest 2').seconds).toBe(120)
    expect(first('rest 1:30').seconds).toBe(90)
  })

  it('reads cardio time and distance', () => {
    expect(first('run 30 minutes 3 miles')).toMatchObject({ kind: 'cardio', name: 'Run', minutes: 30, miles: 3 })
    expect(first('run for 45 minutes')).toMatchObject({ minutes: 45, miles: null })
    expect(first('bike 1 hour')).toMatchObject({ name: 'Bike', minutes: 60 })
    expect(first('running 3.5 miles')).toMatchObject({ name: 'Run', miles: 3.5 })
  })

  it('does not mistake "walking lunges" for a walk', () => {
    expect(first('walking lunges 3 sets of 10').kind).toBe('strength')
  })
})

describe('splitting a stream into items', () => {
  it('splits dictation with no punctuation', () => {
    const items = parse('bench press 3 sets of 10 at 135 squat 185 for 5 rest 90 seconds plank 30 seconds')
    expect(items.map((i) => i.kind)).toEqual(['strength', 'strength', 'rest', 'strength'])
    expect(items[1].name).toBe('Barbell Squat')
  })

  it('splits on commas and "then"', () => {
    expect(parse('bench press 3x10 at 135, then squat 5x5 at 185')).toHaveLength(2)
  })

  it('keeps a pyramid together across a "then"', () => {
    const items = parse('squat 185 for 5 then 205 for 5')
    expect(items).toHaveLength(1)
    expect(weights(items[0])).toEqual([185, 205])
  })

  it('splits on new lines', () => {
    expect(parse('bench press 3x10 at 135\nsquat 5x5 at 185\nrest 60')).toHaveLength(3)
  })

  it('keeps "one" inside an exercise name', () => {
    const it = first('one arm dumbbell row 3 sets of 10')
    expect(it.nameText).toBe('one arm dumbbell row')
    expect(reps(it)).toEqual([10, 10, 10])
  })
})

describe('name resolution', () => {
  it('flags an exercise the database lacks as new, never as matched', () => {
    const it = first('dead hang 30 seconds')
    expect(it).toMatchObject({ resolved: false, source: 'new', name: 'Dead hang' })
  })

  it('recognises a custom exercise', () => {
    const it = first('dead hang 30 seconds', { custom: { 'Dead hang': { timed: true, bodyweight: true } } })
    expect(it).toMatchObject({ resolved: true, source: 'custom', name: 'Dead hang', timed: true })
  })

  it('prefers a name you already use', () => {
    const it = first('bench press 3x10 at 135', { history: ['Bench Press'] })
    expect(it).toMatchObject({ name: 'Bench Press', source: 'yours' })
  })

  it('can be re-resolved to a suggestion', () => {
    const it = first('dead hang 30 seconds')
    const fixed = resolveItemAs(it, 'Hanging Leg Raise', {})
    expect(fixed).toMatchObject({ name: 'Hanging Leg Raise', resolved: true })
    expect(fixed.sets[0].targetSeconds).toBe(30)
  })
})

describe('dumbbell shorthand and equipment', () => {
  const mine = { equipment: ['dumbbell', 'body only'] }

  it('reads "db curl" as the dumbbell curl instead of flagging it', () => {
    const it = first('db curl 3x12 at 25')
    expect(it).toMatchObject({ name: 'Dumbbell Bicep Curl', resolved: true })
    expect(reps(it)).toEqual([12, 12, 12])
    expect(weights(it)).toEqual([25, 25, 25])
  })

  it('splits a run of "db" exercises correctly', () => {
    const items = parse('db bench press 3 sets of 10 at 40 db row 3 sets of 12 at 35 db curl 3x12 at 25')
    expect(items.map((i) => i.name)).toEqual(['Dumbbell Bench Press', 'One-Arm Dumbbell Row', 'Dumbbell Bicep Curl'])
  })

  it('resolves everyday names to dumbbell versions when that is all you have', () => {
    const items = parse('bench press 3x10 at 40 squat 3x10 at 30 row 3x10 at 35', mine)
    expect(items.map((i) => i.name)).toEqual(['Dumbbell Bench Press', 'Dumbbell Squat', 'One-Arm Dumbbell Row'])
    expect(items.every((i) => i.resolved)).toBe(true)
  })

  it('keeps bodyweight work as is', () => {
    expect(first('pushups 3 sets of 12', mine).name).toBe('Pushups')
  })
})

describe('flags and fallbacks', () => {
  it('honours the bodyweight keyword', () => {
    expect(first('squat 3 sets of 10 bodyweight').bodyweight).toBe(true)
    expect(first('squat 3 sets of 10 body weight').bodyweight).toBe(true)
  })

  it('does not treat a leading "Bodyweight" as the flag', () => {
    expect(first('bodyweight squat 3 sets of 10').name).toBe('Bodyweight Squat')
  })

  it('turns bodyweight off when a weight is given', () => {
    expect(first('pushups 3 sets of 10 at 25').bodyweight).toBe(false)
  })

  it('uses the database equipment for a bodyweight default', () => {
    expect(first('pushups 3 sets of 12').bodyweight).toBe(true)
  })

  it('uses last time for a bare name', () => {
    const entries = [{
      type: 'strength', status: 'completed', exerciseName: 'Squat', date: '2026-10-01', bodyweight: false, timed: false,
      sets: [{ targetWeight: 185, targetReps: 5, targetSeconds: null, actualWeight: 190, actualReps: 5, actualSeconds: null }],
    }]
    const it = first('squat', { history: ['Squat'], entries })
    expect(it.usedLastTime).toBe(true)
    expect([weights(it), reps(it)]).toEqual([[190], [5]])
  })

  it('gives three blank sets for a bare unknown name', () => {
    const it = first('squat')
    expect(it.sets).toHaveLength(3)
    expect(it.usedLastTime).toBe(false)
    expect(it.unreadable).toBe(false)
  })

  it('flags numbers it cannot make sense of and falls back to blank sets', () => {
    const it = first('bench press 135 10')
    expect(it.unreadable).toBe(true)
    expect(it.sets).toHaveLength(3)
  })
})

describe('bad input', () => {
  it('returns nothing for empty text', () => {
    expect(parseQuickAdd('')).toEqual({ items: [], warnings: [] })
    expect(parseQuickAdd(undefined)).toEqual({ items: [], warnings: [] })
  })

  it('warns about numbers with no exercise instead of guessing', () => {
    const { items, warnings } = parseQuickAdd('30 seconds')
    expect(items).toEqual([])
    expect(warnings[0]).toMatch(/Ignored numbers/)
  })

  it('warns when a rest has no duration', () => {
    const { items, warnings } = parseQuickAdd('rest')
    expect(items).toEqual([])
    expect(warnings[0]).toMatch(/rest/i)
  })
})

describe('building entries and summaries', () => {
  it('builds a planned strength entry', () => {
    const e = itemToEntry(first('bench press 3x10 at 135'), '2026-10-13')
    expect(e).toMatchObject({ type: 'strength', status: 'planned', date: '2026-10-13', exerciseName: 'Barbell Bench Press - Medium Grip' })
    expect(e.sets).toHaveLength(3)
  })

  it('builds rest and cardio entries', () => {
    expect(itemToEntry(first('rest 90'), 'd')).toMatchObject({ type: 'rest', targetSeconds: 90, startedAt: null, actualSeconds: null })
    expect(itemToEntry(first('run 30 minutes 3 miles'), 'd')).toMatchObject({ type: 'cardio', targetMinutes: 30, targetMiles: 3, actualMinutes: null })
  })

  it('summarises sets compactly', () => {
    expect(summarizeSets(first('bench press 3x10 at 135'))).toBe('3 × 10 @ 135 lb')
    expect(summarizeSets(first('squat 185 for 5 205 for 5'))).toBe('5 @ 185 lb, 5 @ 205 lb')
    expect(summarizeSets(first('plank 3 sets of 30 seconds'))).toBe('3 × 30 sec')
    expect(summarizeSets(first('rest 90'))).toBe('90 sec')
    expect(summarizeSets(first('rest 2'))).toBe('2 min')
    expect(summarizeSets(first('run 30 minutes 3 miles'))).toBe('30 min · 3 mi')
  })
})

describe('parseSpec', () => {
  it('returns no sets for an empty spec', () => {
    expect(parseSpec('').sets).toEqual([])
  })
})
