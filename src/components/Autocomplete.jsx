import { useState } from 'react'

// `suggest(query)` returns [{ name, source }] and takes over from the plain
// `catalog` list when given. `onCreate(name)` adds an explicit "add as custom"
// row when what's typed isn't among the suggestions — it never creates
// anything on its own.
export default function Autocomplete({
  value,
  onChange,
  catalog = [],
  suggest,
  onCreate,
  placeholder,
  required = false,
  autoFocus = false,
}) {
  const [open, setOpen] = useState(false)

  const query = value.trim().toLowerCase()
  const options = suggest
    ? suggest(value)
    : catalog.filter((name) => name.toLowerCase().includes(query)).map((name) => ({ name }))

  const showCreate = !!onCreate && !!query && !options.some((o) => o.name.toLowerCase() === query)
  const showSuggestions = open && (options.length > 0 || showCreate)

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
          {options.map(({ name, source }) => (
            <li key={name}>
              <button
                type="button"
                className="autocomplete__option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectName(name)}
              >
                <span>{name}</span>
                {source === 'custom' && <span className="tag tag--custom">custom</span>}
              </button>
            </li>
          ))}
          {showCreate && (
            <li>
              <button
                type="button"
                className="autocomplete__option autocomplete__option--create"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOpen(false)
                  onCreate(value.trim())
                }}
              >
                + Add “{value.trim()}” as a custom exercise
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
