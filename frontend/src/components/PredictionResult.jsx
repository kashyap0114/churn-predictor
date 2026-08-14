import { useState, useEffect } from 'react';
import SignalBars from './SignalBars';

export default function PredictionResult({ result, onReset }) {
  const [fillPercent, setFillPercent] = useState(0);

  if (!result) return null;

  const probability = Number(result.probability) || 0;
  const probPercent = (probability * 100).toFixed(1);
  const thresholdPercent = ((result.threshold ?? 0.62) * 100).toFixed(0);
  const indicatorPosition = Math.min(Math.max(fillPercent, 0), 100);

  useEffect(() => {
    // Triggers progress animation after mounting
    const frame = requestAnimationFrame(() => {
      setFillPercent(probability * 100);
    });
    return () => cancelAnimationFrame(frame);
  }, [probability]);

  const getSignalLevel = (level) => {
    if (level === "Low") return 1;
    if (level === "Medium") return 2;
    return 3;
  };

  return (
    <div className="card prediction-result">
      <div className="result-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <div className={`risk-badge ${result.risk_level}`}>
            {result.risk_level} RISK
          </div>
          <SignalBars level={getSignalLevel(result.risk_level)} style={{ marginBottom: '1rem' }} />
        </div>
        <div className="prediction-status">{result.prediction === "Churn" ? "Likely to Churn" : "Likely to Stay"}</div>
        <div className="prob-value">{probPercent}%</div>
        <div className="prob-label">Churn Probability Score</div>
      </div>

      <div className="meter-container">
        <div className="meter-labels">
          <span>Low Risk</span>
          <span>Medium Risk</span>
          <span>High Risk</span>
        </div>
        <div className="meter-wrapper">
          <div className="meter-bar">
            <div className="meter-indicator" style={{ left: `${indicatorPosition}%` }} />
          </div>
          <div className="threshold-marker" style={{ left: `${thresholdPercent}%` }}>
            <span>Threshold</span>
            <span>{thresholdPercent}%</span>
          </div>
        </div>
      </div>

      <div className="result-summary">
        <div className="result-summary-item">
          <span>Decision</span>
          <strong>{result.prediction}</strong>
        </div>
        <div className="result-summary-item">
          <span>Risk Level</span>
          <strong>{result.risk_level}</strong>
        </div>
        <div className="result-summary-item">
          <span>Cut-off</span>
          <strong>{thresholdPercent}%</strong>
        </div>
      </div>

      {result.customer_id && (
        <div className="prediction-customer">
          Customer Reference: <strong>{result.customer_id}</strong>
        </div>
      )}

      <div className="result-section">
        <h4>Churn Risk Factors</h4>
        <ul className="result-list">
          {(result.risk_factors || []).map((factor, i) => (
            <li key={i}>{factor}</li>
          ))}
        </ul>
      </div>

      <div className="result-section">
        <h4>Recommended Actions</h4>
        <ul className="result-list recommendations">
          {(result.recommendations || []).map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>

      <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={onReset}>
        Analyze Another Customer
      </button>
    </div>
  );
}