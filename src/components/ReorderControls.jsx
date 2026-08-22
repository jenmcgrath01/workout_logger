export default function ReorderControls({ onMoveUp, onMoveDown }) {
  if (!onMoveUp && !onMoveDown) return null

  return (
    <div className="reorder">
      <button
        type="button"
        className="btn btn--icon reorder__btn"
        aria-label="Move up"
        disabled={!onMoveUp}
        onClick={onMoveUp}
      >
        ↑
      </button>
      <button
        type="button"
        className="btn btn--icon reorder__btn"
        aria-label="Move down"
        disabled={!onMoveDown}
        onClick={onMoveDown}
      >
        ↓
      </button>
    </div>
  )
}
