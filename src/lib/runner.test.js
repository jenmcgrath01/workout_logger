import { describe, it, expect } from 'vitest'
import { firstUnfinished, isStepDone, needsRestStart, nextLiveIndex, progress, runLabel, stepIds, stepKind, summarizeRun } from './runner'

const e = (id, o = {}) => ({ id, date: '2026-10-13', type: 'strength', status: 'planned', ...o })

describe('stepIds', () => {
  it('takes the day\'s entries in order and ignores other days', () => {
    const entries = [e('a'), e('x', { date: '2026-10-14' }), e('b'), e('c')]
    expect(stepIds(entries, '2026-10-13')).toEqual(['a', 'b', 'c'])
  })
})

describe('firstUnfinished', () => {
  const ids = ['a', 'b', 'c']

  it('starts at the first step when nothing is done', () => {
    expect(firstUnfinished(ids, [e('a'), e('b'), e('c')])).toBe(0)
  })

  it('resumes after completed steps', () => {
    expect(firstUnfinished(ids, [e('a', { status: 'completed' }), e('b'), e('c')])).toBe(1)
  })

  it('skips over a deleted step', () => {
    expect(firstUnfinished(ids, [e('b', { status: 'completed' }), e('c')])).toBe(2)
  })

  it('reports the end when everything is done', () => {
    expect(firstUnfinished(ids, ids.map((id) => e(id, { status: 'completed' })))).toBe(3)
  })

  it('reports the end for an empty day', () => {
    expect(firstUnfinished([], [])).toBe(0)
  })
})

describe('nextLiveIndex', () => {
  it('moves to the next step', () => {
    expect(nextLiveIndex(['a', 'b', 'c'], [e('a'), e('b'), e('c')], 0)).toBe(1)
  })

  it('jumps over deleted steps', () => {
    expect(nextLiveIndex(['a', 'b', 'c'], [e('a'), e('c')], 0)).toBe(2)
  })

  it('returns the length after the last step', () => {
    expect(nextLiveIndex(['a', 'b'], [e('a'), e('b')], 1)).toBe(2)
  })

  it('returns the length when everything after is deleted', () => {
    expect(nextLiveIndex(['a', 'b', 'c'], [e('a')], 0)).toBe(3)
  })
})

describe('needsRestStart', () => {
  const rest = (o) => e('r', { type: 'rest', targetSeconds: 90, startedAt: null, ...o })

  it('is true only for a planned, not-yet-started rest', () => {
    expect(needsRestStart(rest())).toBe(true)
    expect(needsRestStart(rest({ startedAt: 123 }))).toBe(false)
    expect(needsRestStart(rest({ status: 'completed' }))).toBe(false)
    expect(needsRestStart(e('s'))).toBe(false)
    expect(needsRestStart(undefined)).toBe(false)
  })
})

describe('stepKind', () => {
  it('classifies entries', () => {
    expect(stepKind(e('a', { type: 'rest' }))).toBe('rest')
    expect(stepKind(e('a', { type: 'cardio' }))).toBe('cardio')
    expect(stepKind(e('a'))).toBe('strength')
  })
})

describe('progress', () => {
  it('counts position among steps that still exist', () => {
    const ids = ['a', 'b', 'c', 'd']
    const entries = [e('a'), e('c'), e('d')]
    expect(progress(ids, entries, 2)).toEqual({ position: 2, total: 3 })
    expect(progress(ids, entries, 0)).toEqual({ position: 1, total: 3 })
  })

  it('reports the full count once past the end', () => {
    expect(progress(['a', 'b'], [e('a'), e('b')], 2)).toEqual({ position: 2, total: 2 })
  })
})

describe('isStepDone', () => {
  it('is done when completed or skipped, not otherwise', () => {
    expect(isStepDone(e('a', { status: 'completed' }), [])).toBe(true)
    expect(isStepDone(e('a'), ['a'])).toBe(true)
    expect(isStepDone(e('a'), ['b'])).toBe(false)
    expect(isStepDone(undefined, [])).toBe(false)
  })
})

describe('summarizeRun', () => {
  it('splits completed and skipped, ignoring deleted steps', () => {
    const entries = [e('a', { status: 'completed' }), e('b'), e('d')]
    const s = summarizeRun(['a', 'b', 'c', 'd'], entries, ['b'])
    expect(s.completed.map((x) => x.id)).toEqual(['a'])
    expect(s.skipped.map((x) => x.id)).toEqual(['b'])
    expect(s.total).toBe(3)
  })

  it('does not count a skipped step that was later completed as skipped', () => {
    const s = summarizeRun(['a'], [e('a', { status: 'completed' })], ['a'])
    expect(s.skipped).toEqual([])
    expect(s.completed).toHaveLength(1)
  })
})

describe('runLabel', () => {
  it('offers nothing when there is nothing left to do', () => {
    expect(runLabel([])).toBeNull()
    expect(runLabel([e('a', { status: 'completed' })])).toBeNull()
  })

  it('says Start for an untouched plan and Resume once something is logged', () => {
    expect(runLabel([e('a'), e('b')])).toBe('Start workout')
    expect(runLabel([e('a', { status: 'completed' }), e('b')])).toBe('Resume workout')
  })
})
