import { useEffect, useRef, useState } from 'react'

const OPTIONS = [
  { kind: 'weight', label: 'Weight', hint: 'A weigh-in' },
  { kind: 'dose', label: 'Dose', hint: 'GLP-1 injection' },
  { kind: 'event', label: 'Event', hint: 'Trip, illness, anything' },
]

// One "Add" button that opens a short list of what you can add.
export default function AddMenu({ onPick }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    const onDown = (e) => root.current && !root.current.contains(e.target) && setOpen(false)
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  return (
    <div className="add-menu" ref={root}>
      <button type="button" className="btn btn--primary add-menu__button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        + Add <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="add-menu__list" role="menu">
          {OPTIONS.map((o) => (
            <button
              key={o.kind}
              type="button"
              role="menuitem"
              className="add-menu__item"
              onClick={() => {
                setOpen(false)
                onPick(o.kind)
              }}
            >
              <span className="add-menu__label">{o.label}</span>
              <span className="add-menu__hint">{o.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
