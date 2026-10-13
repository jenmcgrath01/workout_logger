// The way into the Health screen from Home: a compact summary, or an
// invitation to start tracking when there's nothing logged yet.
export default function HealthCard({ summary, onOpen }) {
  return (
    <button type="button" className="health-card" onClick={onOpen}>
      {summary.hasData ? (
        <span className="health-card__stats">
          <span className="health-card__stat">
            <span className="health-card__label">Weight</span>
            <span className="health-card__value">{summary.latestWeight != null ? `${summary.latestWeight} lb` : '–'}</span>
          </span>
          <span className="health-card__stat">
            <span className="health-card__label">On board</span>
            <span className="health-card__value">{summary.onBoardNow != null ? `${summary.onBoardNow.toFixed(1)} mg` : '–'}</span>
          </span>
          {summary.currentDose != null && (
            <span className="health-card__stat">
              <span className="health-card__label">Dose</span>
              <span className="health-card__value">{summary.currentDose} mg</span>
            </span>
          )}
        </span>
      ) : (
        <span className="health-card__invite">Track weight and GLP-1</span>
      )}
      <span className="health-card__chevron" aria-hidden="true">
        ›
      </span>
    </button>
  )
}
