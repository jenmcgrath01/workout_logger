// What equipment you actually have. It steers name matching ("bench press"
// becomes the dumbbell version) and narrows the browse list. Defaults to
// dumbbells and bodyweight; change it from the chips on the browse screen.
const STORAGE_KEY = 'workout-tracker-equipment'

export const DEFAULT_EQUIPMENT = ['dumbbell', 'body only']

// Spellings used by the exercise database, in the order they appear on screen.
export const EQUIPMENT_OPTIONS = [
  'dumbbell', 'body only', 'barbell', 'kettlebells', 'cable', 'machine', 'bands', 'e-z curl bar', 'exercise ball', 'medicine ball',
]

// Plain names for the chips.
export const EQUIPMENT_LABELS = { 'body only': 'bodyweight', kettlebells: 'kettlebell', bands: 'bands', 'e-z curl bar': 'EZ bar' }

export function loadEquipment() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw == null) return DEFAULT_EQUIPMENT
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : DEFAULT_EQUIPMENT
  } catch {
    return DEFAULT_EQUIPMENT
  }
}

export function saveEquipment(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}
