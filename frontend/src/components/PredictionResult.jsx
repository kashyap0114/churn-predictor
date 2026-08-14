export default function PredictionResult({ result, onReset }) {
  if (!result) return null;

  const probability = Number(result.probability) || 0;
  const probPercent = (probability * 100).toFixed(1);
  const thresholdPercent = ((result.threshold ?? 0.62) * 100).toFixed(0);
  const indicatorPosition = Math.min(Math.max(probability * 100, 0), 100);

  return (
    <div className="card prediction-result fade-in">
      <div className="result-header">
        <div className={`risk-badge ${result.risk_level}`}>{result.risk_level} RISK</div>
        <div className="prediction-status">{result.prediction}</div>
        <div className="prob-value">{probPercent}%</div>
        <div className="prob-label">Churn Probability</div>
      </div>

      <div className="meter-container">
        <div className="meter-labels">
          <span>Low</span><span>Medium</span><span>High</span>
        </div>
        <div className="meter-wrapper">
          <div className="meter-bar">
            <div className="meter-indicator" style={{ left: `${indicatorPosition}%` }} />
          </div>
          <div className="threshold-marker" style={{ left: `${thresholdPercent}%` }}>
            <span>Threshold</span><span>{thresholdPercent}%</span>
          </div>
        </div>
      </div>

      <div className="result-summary">
        <div className="result-summary-item"><span>Model Decision</span><strong>{result.prediction}</strong></div>
        <div className="result-summary-item"><span>Risk Level</span><strong>{result.risk_level}</strong></div>
        <div className="result-summary-item"><span>Decision Threshold</span><strong>{thresholdPercent}%</strong></div>
      </div>

      {result.customer_id && (
        <div className="prediction-customer">Customer ID: <strong>{result.customer_id}</strong></div>
      )}

      <div className="result-section">
        <h4>Why this customer is at risk</h4>
        <ul className="result-list">
          {(result.risk_factors || []).map((factor, i) => <li key={i}>{factor}</li>)}
        </ul>
      </div>

      <div className="result-section">
        <h4>Recommended Action</h4>
        <ul className="result-list recommendations">
          {(result.recommendations || []).map((rec, i) => <li key={i}>{rec}</li>)}
        </ul>
      </div>

      <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={onReset}>
        Analyze Another Customer
      </button>
    </div>
  );
}