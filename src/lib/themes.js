// A day's theme is day-level, not entry-level, so it lives in its own
// date-keyed map rather than being duplicated onto every entry.
const STORAGE_KEY = 'workout-tracker-day-themes'

export function loadThemes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function saveThemes(themes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes))
}

export function setDayTheme(date, theme) {
  const themes = loadThemes()
  const trimmed = (theme ?? '').trim()
  if (trimmed) themes[date] = trimmed
  else delete themes[date]
  saveThemes(themes)
  return themes
}

export function getThemeCatalog(themes) {
  return [...new Set(Object.values(themes))].sort((a, b) => a.localeCompare(b))
}
