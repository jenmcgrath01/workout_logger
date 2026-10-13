import { defaultsFor, isKnownName, matchName } from './exerciseDb'
import { draftFromName } from './draft'

// Turns dictated or typed text into planned entries:
//   "bench press 3 sets of 10 at 135, squat 185 for 5 205 for 5, rest 90 seconds"
// Dictation rarely adds punctuation, so items are split by *shape*: an
// exercise name is a run of plain words, and the numbers after it are its
// spec. A new plain word after a spec starts the next item.

const ONES = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19,
}
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 }

const UNIT_WORDS = new Set(['set', 'rep', 'lb', 'kg', 'sec', 'min', 'hour', 'mile', 'x'])
const CONNECTORS = new Set(['of', 'at', 'for', 'with'])
const SKIP = new Set(['then', 'next', 'also', 'plus'])

const REST_PHRASES = new Set(['rest', 'rest period', 'break'])
const CARDIO_NAMES = {
  run: 'Run', running: 'Run', jog: 'Jog', jogging: 'Jog', walk: 'Walk', walking: 'Walk',
  bike: 'Bike', biking: 'Bike', cycle: 'Bike', cycling: 'Bike', swim: 'Swim', swimming: 'Swim',
  hike: 'Hike', hiking: 'Hike', elliptical: 'Elliptical', treadmill: 'Treadmill',
}

const isNum = (t) => /^\d+(\.\d+)?$/.test(t)
const isNumWord = (t) => t in ONES || t in TENS || t === 'hundred'

// "one thirty five" is a colloquial 135; "forty five" is 45; "one hundred
// thirty five" is 135.
function runValue(words) {
  const vals = words.map((w) => (w in ONES ? ONES[w] : w in TENS ? TENS[w] : 'h'))
  if (vals.includes('h')) {
    let total = 0
    let cur = 0
    for (const v of vals) {
      if (v === 'h') cur = (cur || 1) * 100
      else cur += v
      if (v === 'h') {
        total += cur
        cur = 0
      }
    }
    return total + cur
  }
  if (vals.length >= 2 && vals[0] >= 1 && vals[0] <= 9 && words[1] in TENS) {
    return vals[0] * 100 + vals.slice(1).reduce((a, b) => a + b, 0)
  }
  return vals.reduce((a, b) => a + b, 0)
}

// Number words are only numbers in a numeric position — "one arm row" must keep
// its "one". A run counts as a number when it sits next to a unit, a
// connector, or another number.
function wordsToNumbers(tokens) {
  const contextWord = (t) => t != null && (UNIT_WORDS.has(t) || CONNECTORS.has(t) || isNum(t))
  const out = []
  let i = 0
  while (i < tokens.length) {
    if (!isNumWord(tokens[i])) {
      out.push(tokens[i++])
      continue
    }
    let j = i
    while (j < tokens.length && isNumWord(tokens[j])) j++
    const prev = out[out.length - 1]
    const next = tokens[j]
    if (contextWord(prev) || contextWord(next)) out.push(String(runValue(tokens.slice(i, j))))
    else out.push(...tokens.slice(i, j))
    i = j
  }
  return out
}

function normalizeLine(line) {
  let s = line.toLowerCase()
  s = s.replace(/×/g, ' x ').replace(/@/g, ' at ')
  s = s.replace(/(\d+):(\d{2})/g, (_, m, sec) => ` ${Number(m) * 60 + Number(sec)} sec `)
  s = s.replace(/(\d)\s*x\s*(\d)/g, '$1 x $2')
  s = s.replace(/(\d+)\s+(?:by|times)\s+(\d+)/g, '$1 x $2')
  s = s.replace(/(\d)([a-z])/g, '$1 $2')
  s = s.replace(/body\s+weight/g, 'bodyweight')
  s = s.replace(/[^a-z0-9.\s]/g, ' ').replace(/\.(?!\d)/g, ' ').replace(/(?<!\d)\./g, ' ')
  const unify = {
    sets: 'set', reps: 'rep', lbs: 'lb', pounds: 'lb', pound: 'lb', seconds: 'sec', secs: 'sec', second: 'sec',
    minutes: 'min', mins: 'min', minute: 'min', hours: 'hour', hrs: 'hour', hr: 'hour', miles: 'mile', mi: 'mile',
  }
  const tokens = s.split(/\s+/).filter(Boolean).map((t) => unify[t] ?? t)
  return wordsToNumbers(tokens)
}

// Group a line's tokens into { name, spec } items.
function segment(tokens, orphans) {
  const items = []
  let cur = null
  for (const tok of tokens) {
    if (SKIP.has(tok)) continue
    const hasSpec = cur && cur.spec.length > 0
    const isSpec = isNum(tok) || UNIT_WORDS.has(tok) || (hasSpec && (CONNECTORS.has(tok) || tok === 'and' || tok === 'bodyweight'))
    if (isSpec) {
      if (!cur) orphans.push(tok)
      else if (tok !== 'and') cur.spec.push(tok)
      continue
    }
    if (hasSpec) {
      items.push(cur)
      cur = null
    }
    if (!cur) cur = { name: [], spec: [] }
    cur.name.push(tok)
  }
  if (cur) items.push(cur)
  return items
}

const num = (s) => Number(s)

function timeSeconds(value, unit) {
  const v = num(value)
  return unit === 'hour' ? v * 3600 : unit === 'min' ? v * 60 : v
}

// spec string -> { sets: [{weight, reps, seconds}], timed, timeUnit, bodyweight }
export function parseSpec(spec) {
  const s = ` ${spec} `
  const out = { sets: [], timed: false, timeUnit: 'seconds', bodyweight: /\bbodyweight\b/.test(s) }
  const W = '(\\d+(?:\\.\\d+)?)'

  // Timed: "3 set of 30 sec", "3 x 30 sec", "30 sec", "2 min"
  const timedSets = s.match(new RegExp(`(\\d+) (?:set (?:of )?|x )${W} (sec|min)`))
  const timedOne = s.match(new RegExp(`${W} (sec|min)`))
  if (timedSets || timedOne) {
    const [n, v, unit] = timedSets ? [num(timedSets[1]), timedSets[2], timedSets[3]] : [1, timedOne[1], timedOne[2]]
    out.timed = true
    out.timeUnit = unit === 'min' ? 'minutes' : 'seconds'
    for (let i = 0; i < n; i++) out.sets.push({ weight: null, reps: null, seconds: timeSeconds(v, unit) })
    return out
  }

  // "3 set of 10 [rep] [at] 135 [lb]"
  const setsOf = s.match(new RegExp(`(\\d+) set (?:of )?(\\d+)(?: rep)?(?: (?:at|with))?(?: ${W})?`))
  if (setsOf) {
    const w = setsOf[3] != null ? num(setsOf[3]) : null
    for (let i = 0; i < num(setsOf[1]); i++) out.sets.push({ weight: w, reps: num(setsOf[2]), seconds: null })
    return out
  }

  // "185 for 5 205 for 5" (pyramid) — before "x" so "135 x 10" below stays distinct
  const forPairs = [...s.matchAll(new RegExp(`${W}(?: lb)? for (\\d+)(?: rep)?`, 'g'))]
  if (forPairs.length) {
    for (const p of forPairs) out.sets.push({ weight: num(p[1]), reps: num(p[2]), seconds: null })
    return out
  }

  // "3 x 10 [at] 135" (sets x reps) vs "185 x 5, 205 x 5" (weight x reps)
  const xPairs = [...s.matchAll(new RegExp(`${W} x (\\d+)`, 'g'))]
  if (xPairs.length) {
    const first = num(xPairs[0][1])
    if (xPairs.length === 1 && first <= 20) {
      const after = s.slice(xPairs[0].index + xPairs[0][0].length).match(new RegExp(`^(?: rep)?(?: (?:at|with))?(?: ${W})?`))
      const w = after && after[1] != null ? num(after[1]) : null
      for (let i = 0; i < first; i++) out.sets.push({ weight: w, reps: num(xPairs[0][2]), seconds: null })
    } else {
      for (const p of xPairs) out.sets.push({ weight: num(p[1]), reps: num(p[2]), seconds: null })
    }
    return out
  }

  // "12 rep [at 135]"
  const reps = s.match(new RegExp(`(\\d+) rep(?: (?:at|with))?(?: ${W})?`))
  if (reps) {
    out.sets.push({ weight: reps[2] != null ? num(reps[2]) : null, reps: num(reps[1]), seconds: null })
    return out
  }

  // A lone number after a name ("pushups 20") is a rep count.
  const nums = s.match(/\d+(?:\.\d+)?/g) ?? []
  if (nums.length === 1) out.sets.push({ weight: null, reps: num(nums[0]), seconds: null })
  return out
}

function parseRest(spec) {
  const m = spec.match(/(\d+(?:\.\d+)?)(?: (sec|min|hour))?/)
  if (!m) return null
  // A bare small number ("rest 2") reads as minutes, a bare large one as seconds.
  const unit = m[2] ?? (num(m[1]) <= 10 ? 'min' : 'sec')
  return Math.round(timeSeconds(m[1], unit))
}

function parseCardio(spec) {
  let minutes = null
  let miles = null
  for (const m of spec.matchAll(/(\d+(?:\.\d+)?) (min|hour)/g)) {
    minutes = (minutes ?? 0) + (m[2] === 'hour' ? num(m[1]) * 60 : num(m[1]))
  }
  const mi = spec.match(/(\d+(?:\.\d+)?) mile/)
  if (mi) miles = num(mi[1])
  return { minutes, miles }
}

function sentenceCase(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

function strengthItem(nameTokens, specText, ctx) {
  let tokens = [...nameTokens]
  let bodyweightWord = false
  if (tokens.length > 1 && tokens[tokens.length - 1] === 'bodyweight') {
    tokens = tokens.slice(0, -1)
    bodyweightWord = true
  }
  const nameText = tokens.join(' ')
  const history = ctx.history ?? []
  const customNames = Object.keys(ctx.custom ?? {})

  const match = matchName(nameText, { history, custom: customNames })
  const resolved = match.confident
  const name = resolved ? match.best.name : sentenceCase(nameText)
  const source = resolved ? match.best.source : isKnownName(nameText, { history, custom: customNames }) ? 'yours' : 'new'

  const spec = parseSpec(specText)
  const base = draftFromName(name, ctx.entries ?? [], defaultsFor(name, ctx.custom ?? {}) ?? {})
  const heard = spec.sets.length > 0
  const sets = heard
    ? spec.sets.map((s) => ({
        targetWeight: s.weight,
        targetReps: s.reps,
        targetSeconds: s.seconds,
        actualWeight: null,
        actualReps: null,
        actualSeconds: null,
      }))
    : base.sets

  const hasWeight = heard && spec.sets.some((s) => s.weight != null)
  return {
    kind: 'strength',
    nameText,
    specText,
    name,
    resolved,
    source,
    candidates: resolved ? [] : match.candidates.slice(0, 3).map((c) => ({ name: c.name, source: c.source })),
    // A hold with no weight mentioned is almost always bodyweight.
    bodyweight: hasWeight ? false : spec.bodyweight || bodyweightWord || base.bodyweight || spec.timed,
    timed: spec.timed || base.timed,
    timeUnit: spec.timed ? spec.timeUnit : base.timeUnit,
    enableBeeps: base.enableBeeps,
    sets,
    heard,
    usedLastTime: !heard && base.fromDate != null,
    unreadable: !heard && specText.trim().length > 0,
  }
}

// Re-run an item against a different name (the user picked a suggestion).
export function resolveItemAs(item, name, ctx) {
  return strengthItem(name.split(' '), item.specText, ctx)
}

export function parseQuickAdd(text, ctx = {}) {
  const items = []
  const warnings = []

  for (const line of (text ?? '').split(/\n+/)) {
    const orphans = []
    for (const seg of segment(normalizeLine(line), orphans)) {
      // "run for 45 minutes": the "for" belongs to the spec, not the name.
      while (seg.name.length > 1 && CONNECTORS.has(seg.name[seg.name.length - 1])) seg.name.pop()
      const phrase = seg.name.join(' ')
      const spec = seg.spec.join(' ')
      if (REST_PHRASES.has(phrase)) {
        const seconds = parseRest(spec)
        if (seconds == null) warnings.push(`Couldn’t hear how long to rest (“${phrase} ${spec}”)`)
        else items.push({ kind: 'rest', seconds })
      } else if (phrase in CARDIO_NAMES) {
        const { minutes, miles } = parseCardio(spec)
        const heard = minutes != null || miles != null
        items.push({
          kind: 'cardio',
          name: CARDIO_NAMES[phrase],
          minutes,
          miles,
          unreadable: !heard,
        })
      } else {
        items.push(strengthItem(seg.name, spec, ctx))
      }
    }
    if (orphans.length) warnings.push(`Ignored numbers with no exercise: ${orphans.join(' ')}`)
  }
  return { items, warnings }
}

// One planned entry draft per parsed item, ready for storage.addEntries.
export function itemToEntry(item, date) {
  const common = { date, status: 'planned', notes: '' }
  if (item.kind === 'rest') {
    return { ...common, type: 'rest', targetSeconds: item.seconds, actualSeconds: null, startedAt: null }
  }
  if (item.kind === 'cardio') {
    return {
      ...common,
      type: 'cardio',
      exerciseName: item.name,
      targetMinutes: item.minutes,
      targetMiles: item.miles,
      actualMinutes: null,
      actualMiles: null,
    }
  }
  return {
    ...common,
    type: 'strength',
    exerciseName: item.name,
    bodyweight: item.bodyweight,
    timed: item.timed,
    timeUnit: item.timeUnit,
    enableBeeps: item.enableBeeps,
    sets: item.sets,
  }
}

// "3 × 10 @ 135 lb", "185×5, 205×5", "3 × 30 sec" — for the preview.
export function summarizeSets(item) {
  if (item.kind === 'rest') return `${item.seconds >= 60 && item.seconds % 60 === 0 ? `${item.seconds / 60} min` : `${item.seconds} sec`}`
  if (item.kind === 'cardio') {
    return [item.minutes != null && `${item.minutes} min`, item.miles != null && `${item.miles} mi`].filter(Boolean).join(' · ')
  }
  const sets = item.sets
  if (!sets.length) return ''
  const fmt = (s) => {
    const count = s.targetSeconds != null ? `${item.timeUnit === 'minutes' ? s.targetSeconds / 60 : s.targetSeconds} ${item.timeUnit === 'minutes' ? 'min' : 'sec'}` : s.targetReps != null ? `${s.targetReps}` : '–'
    return s.targetWeight != null ? `${count} @ ${s.targetWeight} lb` : count
  }
  const first = fmt(sets[0])
  if (sets.every((s) => fmt(s) === first)) return sets.length > 1 ? `${sets.length} × ${first}` : first
  return sets.map(fmt).join(', ')
}
