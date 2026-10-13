// Exercises the standard database doesn't have (dead hangs, a gym's odd
// machine). Kept in their own map, name -> { muscles, timed, bodyweight }, so
// they can be tagged "custom" in the UI and so their defaults are remembered.
const STORAGE_KEY = 'workout-tracker-custom-exercises'

export function loadCustom() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function saveCustom(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function addCustom(name, info = {}) {
  const trimmed = (name ?? '').trim()
  const map = loadCustom()
  if (!trimmed) return map
  map[trimmed] = {
    muscles: info.muscles ?? [],
    timed: !!info.timed,
    bodyweight: !!info.bodyweight,
  }
  saveCustom(map)
  return map
}
