import raw from '../data/exercises.json'

// [name, primary muscle, equipment, category] — see scripts/build-exercise-db.mjs
export const DB = raw.map(([name, muscle, equipment, category]) => ({ name, muscle, equipment, category }))

const DB_BY_NAME = new Map(DB.map((e) => [e.name, e]))

// The database has no plain "Bench Press" or "Squat", so the everyday names
// map to the classic version. Every target is checked against the data in
// exerciseDb.test.js, so a regenerated database can't leave one dangling.
export const ALIASES = {
  'bench press': 'Barbell Bench Press - Medium Grip',
  'bench': 'Barbell Bench Press - Medium Grip',
  'incline bench press': 'Barbell Incline Bench Press - Medium Grip',
  'incline bench': 'Barbell Incline Bench Press - Medium Grip',
  'squat': 'Barbell Squat',
  'back squat': 'Barbell Squat',
  'deadlift': 'Barbell Deadlift',
  'rdl': 'Romanian Deadlift',
  'overhead press': 'Standing Military Press',
  'military press': 'Standing Military Press',
  'shoulder press': 'Dumbbell Shoulder Press',
  'pull up': 'Pullups',
  'chin up': 'Chin-Up',
  'push up': 'Pushups',
  'row': 'Bent Over Barbell Row',
  'barbell row': 'Bent Over Barbell Row',
  'bent over row': 'Bent Over Barbell Row',
  'cable row': 'Seated Cable Rows',
  'seated row': 'Seated Cable Rows',
  'lat pulldown': 'Wide-Grip Lat Pulldown',
  'curl': 'Dumbbell Bicep Curl',
  'bicep curl': 'Dumbbell Bicep Curl',
  'tricep pushdown': 'Triceps Pushdown',
  'lateral raise': 'Side Lateral Raise',
  'lunge': 'Dumbbell Lunges',
  'hip thrust': 'Barbell Hip Thrust',
  'glute bridge': 'Barbell Glute Bridge',
  'calf raise': 'Standing Calf Raises',
  'sit up': 'Sit-Up',
  'crunch': 'Crunches',
  'leg raise': 'Hanging Leg Raise',
  'step up': 'Dumbbell Step Ups',
  'farmer walk': "Farmer's Walk",
  'shrug': 'Barbell Shrug',
  'dip': 'Dips - Chest Version',
  'fly': 'Dumbbell Flyes',
}

// The same everyday names, resolved to the dumbbell version. Used for "db
// curl" (always) and whenever your equipment is dumbbells without a barbell.
// Goblet Squat is tagged kettlebells in the data but is a dumbbell staple.
export const DUMBBELL_ALIASES = {
  'bench press': 'Dumbbell Bench Press',
  'bench': 'Dumbbell Bench Press',
  'incline bench press': 'Incline Dumbbell Press',
  'incline bench': 'Incline Dumbbell Press',
  'incline press': 'Incline Dumbbell Press',
  'decline bench press': 'Decline Dumbbell Bench Press',
  'floor press': 'Dumbbell Floor Press',
  'squat': 'Dumbbell Squat',
  'goblet squat': 'Goblet Squat',
  'deadlift': 'Stiff-Legged Dumbbell Deadlift',
  'romanian deadlift': 'Stiff-Legged Dumbbell Deadlift',
  'rdl': 'Stiff-Legged Dumbbell Deadlift',
  'shoulder press': 'Dumbbell Shoulder Press',
  'overhead press': 'Dumbbell Shoulder Press',
  'military press': 'Dumbbell Shoulder Press',
  'arnold press': 'Arnold Dumbbell Press',
  'row': 'One-Arm Dumbbell Row',
  'one arm row': 'One-Arm Dumbbell Row',
  'bent over row': 'Bent Over Two-Dumbbell Row',
  'two arm row': 'Bent Over Two-Dumbbell Row',
  'curl': 'Dumbbell Bicep Curl',
  'bicep curl': 'Dumbbell Bicep Curl',
  'hammer curl': 'Hammer Curls',
  'incline curl': 'Incline Dumbbell Curl',
  'concentration curl': 'Concentration Curls',
  'lunge': 'Dumbbell Lunges',
  'rear lunge': 'Dumbbell Rear Lunge',
  'reverse lunge': 'Dumbbell Rear Lunge',
  'fly': 'Dumbbell Flyes',
  'lateral raise': 'Side Lateral Raise',
  'front raise': 'Front Dumbbell Raise',
  'step up': 'Dumbbell Step Ups',
  'calf raise': 'Standing Dumbbell Calf Raise',
  'shrug': 'Dumbbell Shrug',
  'tricep extension': 'Standing Dumbbell Triceps Extension',
  'tricep kickback': 'Tricep Dumbbell Kickback',
  'kickback': 'Tricep Dumbbell Kickback',
}

const STOPWORDS = new Set(['with', 'the', 'a', 'an', 'and', 'of', 'to', 'on'])

// Dictation and typing both produce run-together forms the database spells
// with a hyphen or space ("pushups" vs "Push-Up").
const SYNONYMS = {
  pushup: ['push', 'up'],
  pullup: ['pull', 'up'],
  situp: ['sit', 'up'],
  chinup: ['chin', 'up'],
  dumbell: ['dumbbell'],
  db: ['dumbbell'],
  bb: ['barbell'],
  kb: ['kettlebell'],
  flye: ['fly'],
  tricep: ['triceps'],
  bicep: ['biceps'],
}

function singularize(t) {
  // "pull-ups" splits into "pull" + "ups", and "ups" is too short for the
  // general rule below.
  if (t === 'ups') return 'up'
  if (t.length <= 3) return t
  if (t.endsWith('ies')) return `${t.slice(0, -3)}y`
  if (t.endsWith('sses')) return t.slice(0, -2)
  if (/(ches|shes|xes)$/.test(t)) return t.slice(0, -2)
  if (t.endsWith('ss')) return t
  if (t.endsWith('s')) return t.slice(0, -1)
  return t
}

export function tokenize(text) {
  const words = (text ?? '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(singularize)
    .flatMap((w) => SYNONYMS[w] ?? [w])
    .map(singularize)
    .filter((w) => !STOPWORDS.has(w))
  return words
}

function key(text) {
  return tokenize(text).join(' ')
}

// Index the DB names by normalised form once.
const DB_KEYS = DB.map((e) => ({ ...e, key: key(e.name), tokens: new Set(tokenize(e.name)) }))

export function dbEntry(name) {
  return DB_BY_NAME.get(name) ?? null
}

export function nameKey(text) {
  return key(text)
}

// Starting flags for a name that nothing has been logged under yet: a custom
// exercise's remembered settings, or what the database says about the
// equipment ("body only" means no weight).
export function defaultsFor(name, customMap = {}) {
  const c = customMap[name]
  if (c) return { bodyweight: !!c.bodyweight, timed: !!c.timed }
  const e = dbEntry(name)
  if (e) return { bodyweight: e.equipment === 'body only', timed: false }
  return null
}

function dice(a, b) {
  if (!a.size || !b.size) return 0
  let shared = 0
  for (const t of a) if (b.has(t)) shared++
  return (2 * shared) / (a.size + b.size)
}

// Preferred equipment, e.g. ['dumbbell', 'body only']. Empty or missing means
// no preference. Exercises with no listed equipment are never penalised.
function equipmentSet(ctx) {
  return ctx.equipment?.length ? new Set(ctx.equipment) : null
}

function prefersDumbbell(prefer) {
  return !!prefer && prefer.has('dumbbell') && !prefer.has('barbell')
}

function equipmentBias(e, prefer) {
  if (!prefer || e.source !== 'db' || e.equipment == null) return 0
  return prefer.has(e.equipment) ? 0.05 : -0.08
}

// Where a name came from, so the UI can label it: your own history, a custom
// exercise you made, or the standard database.
function pool({ history = [], custom = [] }) {
  const seen = new Set()
  const out = []
  const add = (name, source, equipment = null) => {
    const k = key(name)
    if (!k || seen.has(k)) return
    seen.add(k)
    out.push({ name, source, equipment, key: k, tokens: new Set(tokenize(name)) })
  }
  // The database wins a spelling clash, so a standard name is never shadowed
  // by an identical-looking history entry.
  for (const e of DB_KEYS) add(e.name, 'db', e.equipment)
  for (const n of custom) add(n, 'custom')
  for (const n of history) add(n, 'yours')
  return out
}

/**
 * Resolve free text ("bench press", "dead hang") to an exercise name.
 *
 * `confident` is deliberately conservative: it is only true for an exact
 * normalised match, a known alias, or a clearly dominant fuzzy match. Anything
 * weaker comes back with `confident: false` and a ranked `candidates` list,
 * which is what lets the UI offer "add as custom" instead of guessing.
 */
export function matchName(text, ctx = {}) {
  const qTokens = tokenize(text)
  const k = qTokens.join(' ')
  if (!k) return { confident: false, best: null, candidates: [] }

  const entries = pool(ctx)
  const prefer = equipmentSet(ctx)
  const confidentHit = (hit) => ({ confident: true, best: hit, candidates: [hit] })

  // Your own and custom names first: if you already use "Bench Press", it wins.
  const own = entries.find((e) => e.key === k && e.source !== 'db')
  if (own) return confidentHit(own)

  // "db curl" always means the dumbbell version, whatever equipment is
  // preferred. Without "db", dumbbell-only equipment gets the same treatment.
  const forcedDumbbell = qTokens.includes('dumbbell')
  if (forcedDumbbell || prefersDumbbell(prefer)) {
    const bare = qTokens.filter((t) => t !== 'dumbbell').join(' ')
    const target = DUMBBELL_ALIASES[forcedDumbbell ? bare : k]
    const hit = target && entries.find((e) => e.name === target)
    if (hit) return confidentHit(hit)
  }

  const aliasTarget = ALIASES[k]
  if (aliasTarget) {
    const hit = entries.find((e) => e.name === aliasTarget)
    if (hit) return confidentHit(hit)
  }

  const exact = entries.find((e) => e.key === k)
  if (exact) return confidentHit(exact)

  // An unknown "db ..." phrase is only ever matched against dumbbell
  // exercises, so it can't come back as a barbell lift.
  const candidates = forcedDumbbell ? entries.filter((e) => e.source !== 'db' || e.equipment === 'dumbbell') : entries
  const q = new Set(qTokens)
  const ranked = candidates
    .map((e) => {
      const score = dice(q, e.tokens)
      return { ...e, score, rank: score + equipmentBias(e, prefer) }
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.rank - a.rank || a.name.length - b.name.length)
    .slice(0, 5)

  const [top, second] = ranked
  const confident = !!top && top.score >= 0.75 && (!second || top.rank - second.rank >= 0.1)
  return { confident, best: confident ? top : null, candidates: ranked }
}

// True when a name is already something the app recognises, so saving it
// isn't creating a new custom exercise.
export function isKnownName(name, ctx = {}) {
  const k = key(name)
  if (!k) return false
  if (ALIASES[k]) return true
  return pool(ctx).some((e) => e.key === k)
}

// Typed shorthand, as in "db curl", expanded for substring matching.
const SHORTHAND = { db: 'dumbbell', dumbell: 'dumbbell', dumbells: 'dumbbell', dumbbells: 'dumbbell', bb: 'barbell', kb: 'kettlebell' }

/**
 * Autocomplete suggestions. Your own names come first, then custom, then the
 * database; the database is never dumped on an empty query.
 */
export function suggest(query, ctx = {}, limit = 8) {
  const q = (query ?? '').toLowerCase().trim()
  const words = q
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => SHORTHAND[w] ?? w)
  const entries = pool(ctx)
  const prefer = equipmentSet(ctx)
  const rank = { yours: 0, custom: 1, db: 2 }
  // Within the database, exercises you have the equipment for come first.
  const offKit = (e) => (e.source === 'db' && prefer && e.equipment != null && !prefer.has(e.equipment) ? 1 : 0)

  const pick = entries.filter((e) => {
    if (!words.length) return e.source !== 'db'
    const lower = e.name.toLowerCase()
    return words.every((w) => lower.includes(w))
  })

  pick.sort((a, b) => rank[a.source] - rank[b.source] || offKit(a) - offKit(b) || a.name.length - b.name.length || a.name.localeCompare(b.name))
  return pick.slice(0, limit).map(({ name, source }) => ({ name, source }))
}

// Exercises for a set of muscle groups (theme browsing).
export function byMuscles(muscles, { exclude = ['stretching', 'cardio'], equipment = [] } = {}) {
  const want = new Set(muscles)
  const eq = equipment.length ? new Set(equipment) : null
  return DB.filter(
    (e) => want.has(e.muscle) && !exclude.includes(e.category) && (!eq || e.equipment == null || eq.has(e.equipment))
  )
}

export const MUSCLES = [...new Set(DB.map((e) => e.muscle).filter(Boolean))].sort()
