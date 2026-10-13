import { describe, it, expect } from 'vitest'
import { ALIASES, DB, DUMBBELL_ALIASES, MUSCLES, byMuscles, dbEntry, isKnownName, matchName, suggest, tokenize } from './exerciseDb'
import { musclesForTheme } from './themeMuscles'

describe('data integrity', () => {
  it('loads the bundled database', () => {
    expect(DB.length).toBeGreaterThan(800)
    expect(MUSCLES).toContain('chest')
  })

  it('every alias points at a real exercise', () => {
    for (const [alias, target] of Object.entries(ALIASES)) {
      expect(dbEntry(target), `${alias} -> ${target}`).not.toBeNull()
    }
  })

  it('every alias key is already in normalised form, or it could never match', () => {
    for (const alias of Object.keys(ALIASES)) {
      expect(tokenize(alias).join(' '), alias).toBe(alias)
    }
  })
})

describe('tokenize', () => {
  it('treats run-together and hyphenated spellings the same', () => {
    expect(tokenize('pushups')).toEqual(tokenize('Push-Up'))
    expect(tokenize('pull-ups')).toEqual(tokenize('Pullups'))
  })

  it('singularises plurals', () => {
    expect(tokenize('Lunges')).toEqual(tokenize('lunge'))
    expect(tokenize('crunches')).toEqual(tokenize('crunch'))
    expect(tokenize('flies')).toEqual(tokenize('Flyes'))
  })
})

describe('matchName', () => {
  it('resolves an everyday name to the classic lift through an alias', () => {
    const m = matchName('bench press')
    expect(m.confident).toBe(true)
    expect(m.best.name).toBe('Barbell Bench Press - Medium Grip')
  })

  it('handles dictation-style phrasing', () => {
    expect(matchName('push ups').best.name).toBe('Pushups')
    expect(matchName('Pull-ups').best.name).toBe('Pullups')
    expect(matchName('lunges').best.name).toBe('Dumbbell Lunges')
  })

  it('matches an exact standard name', () => {
    expect(matchName('plank').best.name).toBe('Plank')
  })

  it('prefers a name you already use over the alias', () => {
    const m = matchName('Bench Press', { history: ['Bench Press'] })
    expect(m.best).toMatchObject({ name: 'Bench Press', source: 'yours' })
  })

  it('does NOT confidently match an exercise the database lacks', () => {
    const m = matchName('dead hang')
    expect(m.confident).toBe(false)
    expect(m.best).toBeNull()
  })

  it('does not guess from a single ambiguous word', () => {
    expect(matchName('hang').confident).toBe(false)
  })

  it('finds a custom exercise by name', () => {
    expect(matchName('Dead hang', { custom: ['Dead hang'] }).best).toMatchObject({ name: 'Dead hang', source: 'custom' })
  })

  it('returns nothing for empty input', () => {
    expect(matchName('  ')).toEqual({ confident: false, best: null, candidates: [] })
  })
})

describe('isKnownName', () => {
  it('knows standard, aliased, history and custom names', () => {
    expect(isKnownName('Plank')).toBe(true)
    expect(isKnownName('bench press')).toBe(true)
    expect(isKnownName('My Odd Machine', { history: ['My Odd Machine'] })).toBe(true)
    expect(isKnownName('Dead hang', { custom: ['Dead hang'] })).toBe(true)
  })

  it('does not know a brand new name', () => {
    expect(isKnownName('Dead hang')).toBe(false)
  })
})

describe('suggest', () => {
  it('shows your own names first and never dumps the database on an empty query', () => {
    const s = suggest('', { history: ['Squat'], custom: ['Dead hang'] })
    expect(s.map((x) => x.name).sort()).toEqual(['Dead hang', 'Squat'])
  })

  it('ranks yours, then custom, then the database', () => {
    const s = suggest('squat', { history: ['Squat'], custom: ['Odd squat'] })
    expect(s[0]).toMatchObject({ name: 'Squat', source: 'yours' })
    expect(s[1]).toMatchObject({ name: 'Odd squat', source: 'custom' })
    expect(s[2].source).toBe('db')
  })

  it('matches every typed word anywhere in the name', () => {
    expect(suggest('bench press').every((x) => /bench/i.test(x.name) && /press/i.test(x.name))).toBe(true)
  })

  it('caps the number of results', () => {
    expect(suggest('a', {}, 5).length).toBeLessThanOrEqual(5)
  })
})

describe('byMuscles', () => {
  it('returns only the chosen muscles, without stretches or cardio', () => {
    const list = byMuscles(['chest'])
    expect(list.length).toBeGreaterThan(10)
    expect(list.every((e) => e.muscle === 'chest')).toBe(true)
    expect(list.some((e) => e.category === 'stretching' || e.category === 'cardio')).toBe(false)
  })
})

describe('musclesForTheme', () => {
  it('maps common themes', () => {
    expect(musclesForTheme('Upper body').muscles).toEqual(expect.arrayContaining(['chest', 'lats', 'shoulders']))
    expect(musclesForTheme('Legs').muscles).toEqual(expect.arrayContaining(['quadriceps', 'hamstrings', 'glutes']))
    expect(musclesForTheme('core').muscles).toEqual(expect.arrayContaining(['abdominals']))
  })

  it('combines themes written together', () => {
    const { muscles } = musclesForTheme('Legs + core')
    expect(muscles).toEqual(expect.arrayContaining(['quadriceps', 'abdominals']))
  })

  it('treats whole body as every muscle', () => {
    expect(musclesForTheme('Whole body').muscles.length).toBe(17)
  })

  it('flags cardio separately', () => {
    expect(musclesForTheme('Cardio')).toMatchObject({ cardio: true, matched: true, muscles: [] })
  })

  it('reports an unrecognised theme as unmatched', () => {
    expect(musclesForTheme('Banana day')).toMatchObject({ matched: false, muscles: [] })
  })
})

describe('dumbbell shorthand', () => {
  const name = (text, ctx) => matchName(text, ctx).best?.name

  it('reads "db" and common misspellings as dumbbell', () => {
    expect(tokenize('db curl')).toEqual(tokenize('dumbbell curl'))
    expect(tokenize('dumbell curl')).toEqual(tokenize('dumbbell curl'))
  })

  it('resolves "db <lift>" to the dumbbell version, with no preference set', () => {
    expect(name('db curl')).toBe('Dumbbell Bicep Curl')
    expect(name('db bench')).toBe('Dumbbell Bench Press')
    expect(name('db bench press')).toBe('Dumbbell Bench Press')
    expect(name('dumbell bench')).toBe('Dumbbell Bench Press')
    expect(name('db deadlift')).toBe('Stiff-Legged Dumbbell Deadlift')
    expect(name('db hammer curl')).toBe('Hammer Curls')
    expect(name('db row')).toBe('One-Arm Dumbbell Row')
    expect(name('db squat')).toBe('Dumbbell Squat')
  })

  it('is confident about those, not a guess', () => {
    for (const t of ['db curl', 'db bench', 'db deadlift', 'db hammer curl']) {
      expect(matchName(t).confident, t).toBe(true)
    }
  })

  it('"db" overrides a barbell preference', () => {
    expect(name('db squat', { equipment: ['barbell'] })).toBe('Dumbbell Squat')
  })

  it('does not guess a barbell lift for an unknown dumbbell phrase', () => {
    const m = matchName('db something odd')
    expect(m.confident).toBe(false)
    expect(m.candidates.every((c) => c.source !== 'db' || dbEntry(c.name).equipment === 'dumbbell')).toBe(true)
  })
})

describe('equipment preference', () => {
  const mine = { equipment: ['dumbbell', 'body only'] }
  const name = (text, ctx) => matchName(text, ctx).best?.name

  it('turns everyday names into the dumbbell version', () => {
    expect(name('bench press', mine)).toBe('Dumbbell Bench Press')
    expect(name('squat', mine)).toBe('Dumbbell Squat')
    expect(name('row', mine)).toBe('One-Arm Dumbbell Row')
    expect(name('overhead press', mine)).toBe('Dumbbell Shoulder Press')
    expect(name('deadlift', mine)).toBe('Stiff-Legged Dumbbell Deadlift')
  })

  it('leaves bodyweight exercises alone', () => {
    expect(name('pushups', mine)).toBe('Pushups')
    expect(name('pull ups', mine)).toBe('Pullups')
    expect(name('plank', mine)).toBe('Plank')
  })

  it('keeps the barbell version when you have a barbell', () => {
    expect(name('bench press', { equipment: ['dumbbell', 'barbell'] })).toBe('Barbell Bench Press - Medium Grip')
  })

  it('changes nothing when no preference is given', () => {
    expect(name('bench press')).toBe('Barbell Bench Press - Medium Grip')
  })

  it('still prefers a name you already use', () => {
    expect(matchName('bench press', { ...mine, history: ['Bench Press'] }).best.name).toBe('Bench Press')
  })

  it('narrows browsing to your equipment, but keeps exercises with no listed equipment', () => {
    const list = byMuscles(['chest'], { equipment: ['dumbbell', 'body only'] })
    expect(list.length).toBeGreaterThan(5)
    expect(list.every((e) => e.equipment == null || ['dumbbell', 'body only'].includes(e.equipment))).toBe(true)
    expect(list.some((e) => e.equipment === 'barbell')).toBe(false)
  })

  it('does not filter when no equipment is chosen', () => {
    expect(byMuscles(['chest'], { equipment: [] }).length).toBe(byMuscles(['chest']).length)
  })
})

describe('suggest with shorthand', () => {
  it('expands "db" so the dropdown finds dumbbell exercises', () => {
    const s = suggest('db curl')
    expect(s.length).toBeGreaterThan(0)
    expect(s.every((x) => /dumbbell/i.test(x.name) && /curl/i.test(x.name))).toBe(true)
  })

  it('lists your equipment first among database results', () => {
    const s = suggest('curl', { equipment: ['dumbbell'] }, 5)
    expect(s.slice(0, 3).every((x) => dbEntry(x.name)?.equipment === 'dumbbell')).toBe(true)
  })
})

describe('dumbbell alias integrity', () => {
  it('every target exists and is a dumbbell exercise', () => {
    for (const [alias, target] of Object.entries(DUMBBELL_ALIASES)) {
      const e = dbEntry(target)
      expect(e, `${alias} -> ${target}`).not.toBeNull()
      expect(['dumbbell', 'kettlebells'], `${target} equipment`).toContain(e.equipment)
    }
  })

  it('every key is already in normalised form', () => {
    for (const alias of Object.keys(DUMBBELL_ALIASES)) {
      expect(tokenize(alias).join(' '), alias).toBe(alias)
    }
  })
})
