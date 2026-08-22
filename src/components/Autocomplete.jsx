import { useState } from 'react'

export default function Autocomplete({ value, onChange, catalog, placeholder, required = false, autoFocus = false }) {
  const [open, setOpen] = useState(false)

  const matches = catalog.filter((name) => name.toLowerCase().includes(value.trim().toLowerCase()))
  const showSuggestions = open && matches.length > 0

  function selectName(name) {
    onChange(name)
    setOpen(false)
  }

  return (
    <div className="autocomplete">
      <input
        className="input"
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        required={required}
        autoFocus={autoFocus}
      />
      {showSuggestions && (
        <ul className="autocomplete__list">
          {matches.map((name) => (
            <li key={name}>
              <button
                type="button"
                className="autocomplete__option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectName(name)}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
