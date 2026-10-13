// Themes are free text ("Upper body", "legs + core"), so they are matched by
// keyword and the matches are combined. An unrecognised theme returns
// matched: false and the UI falls back to letting the user pick muscle groups.
const ALL = [
  'abdominals', 'abductors', 'adductors', 'biceps', 'calves', 'chest', 'forearms', 'glutes',
  'hamstrings', 'lats', 'lower back', 'middle back', 'neck', 'quadriceps', 'shoulders', 'traps', 'triceps',
]

const RULES = [
  [/whole|full|total/, ALL],
  [/upper/, ['chest', 'lats', 'middle back', 'shoulders', 'biceps', 'triceps', 'traps', 'forearms']],
  [/lower|leg/, ['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors']],
  [/push/, ['chest', 'shoulders', 'triceps']],
  [/pull/, ['lats', 'middle back', 'biceps', 'traps', 'forearms']],
  [/core|\babs?\b/, ['abdominals', 'lower back']],
  [/chest/, ['chest']],
  [/back/, ['lats', 'middle back', 'lower back']],
  [/shoulder/, ['shoulders']],
  [/arm/, ['biceps', 'triceps', 'forearms']],
  [/glute|butt/, ['glutes']],
]

export function musclesForTheme(theme) {
  const t = (theme ?? '').toLowerCase()
  const muscles = new Set()
  let matched = false
  for (const [pattern, list] of RULES) {
    if (pattern.test(t)) {
      matched = true
      list.forEach((m) => muscles.add(m))
    }
  }
  const cardio = /cardio|run|bike|cycl|swim|row(ing)?\b|hiit/.test(t)
  if (cardio) matched = true
  return { muscles: [...muscles], cardio, matched }
}
