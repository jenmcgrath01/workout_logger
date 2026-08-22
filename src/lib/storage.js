const STORAGE_KEY = 'workout-tracker-entries'

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function addEntry(entry) {
  const entries = loadEntries()
  const newEntry = { id: uuid(), type: 'strength', notes: '', ...entry }
  saveEntries([...entries, newEntry])
  return newEntry
}

export function updateEntry(id, updates) {
  const entries = loadEntries()
  const next = entries.map((e) => (e.id === id ? { ...e, ...updates } : e))
  saveEntries(next)
  return next.find((e) => e.id === id)
}

// Visible order follows array order, so swapping two entries in place is all a
// reorder needs.
export function swapEntries(idA, idB) {
  const entries = loadEntries()
  const i = entries.findIndex((e) => e.id === idA)
  const j = entries.findIndex((e) => e.id === idB)
  if (i === -1 || j === -1) return entries
  const next = [...entries]
  ;[next[i], next[j]] = [next[j], next[i]]
  saveEntries(next)
  return next
}

export function deleteEntry(id) {
  const entries = loadEntries()
  saveEntries(entries.filter((e) => e.id !== id))
}

export function todayISO() {
  const d = new Date()
  const tzOffsetMs = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10)
}

export function addDays(dateISO, delta) {
  const [y, m, d] = dateISO.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + delta)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
