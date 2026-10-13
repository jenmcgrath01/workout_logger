import { useEffect, useState } from 'react'

// Which menu entry a screen belongs to: the workout flow (plan, log, run...) is
// all "Workouts"; Health is its own place.
const GROUP = { health: 'health' }
const ITEMS = [
  { key: 'home', label: 'Workouts', hint: 'Today, plans and logging' },
  { key: 'health', label: 'Health', hint: 'Weight and GLP-1' },
]

export default function TopBar({ screen, onNavigate }) {
  const [open, setOpen] = useState(false)
  const here = GROUP[screen] ?? 'home'

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function go(key) {
    setOpen(false)
    onNavigate(key)
  }

  return (
    <>
      <header className="topbar">
        <button type="button" className="topbar__menu" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <span />
          <span />
          <span />
        </button>
        <span className="topbar__title">Workout Tracker</span>
      </header>

      {open && (
        <>
          <div className="drawer__backdrop" onClick={() => setOpen(false)} />
          <nav className="drawer" aria-label="Main menu">
            <div className="drawer__head">
              <span className="drawer__title">Menu</span>
              <button type="button" className="btn btn--icon" aria-label="Close menu" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>
            {ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`drawer__item ${here === item.key ? 'is-current' : ''}`}
                aria-current={here === item.key ? 'page' : undefined}
                onClick={() => go(item.key)}
              >
                <span className="drawer__label">{item.label}</span>
                <span className="drawer__hint">{item.hint}</span>
              </button>
            ))}
          </nav>
        </>
      )}
    </>
  )
}
