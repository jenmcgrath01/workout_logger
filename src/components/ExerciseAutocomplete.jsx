export default function ExerciseAutocomplete({ value, onChange, catalog, listId }) {
  return (
    <>
      <input
        className="input"
        type="text"
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Exercise name"
        autoComplete="off"
        required
      />
      <datalist id={listId}>
        {catalog.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </>
  )
}
