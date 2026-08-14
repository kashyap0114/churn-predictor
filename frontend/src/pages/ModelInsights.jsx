import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const API_URL = "http://localhost:8000/api";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        padding: '0.5rem 0.75rem',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-md)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}>
        <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{label}</p>
        <p style={{ margin: 0, color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem' }}>
          Importance: {(payload[0].value * 100).toFixed(2)}%
        </p>
      </div>
    );
  }
  return null;
};

export default function ModelInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`${API_URL}/model-performance`)
      .then(res => setData(res.data))
      .catch(err => setError("Could not load model performance metrics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="state-box"><div className="loading-spinner"></div></div>;
  if (error || !data) return <div className="state-box"><p>{error}</p></div>;

  const { selected_model = "the selected model", models = {}, feature_importance = [], confusion_matrix = {} } = data;
  
  const comparisonData = Object.entries(models).map(([name, metrics]) => ({
    name, 
    Accuracy: metrics.Accuracy || 0, 
    Precision: metrics.Precision || 0,
    Recall: metrics.Recall || 0, 
    F1: metrics.F1 || 0, 
    ROC_AUC: metrics["ROC-AUC"] || 0
  }));

  const chartData = feature_importance.slice(0, 10).map(item => ({
    feature: item.feature.replace(/^cat__|num__|_/g, " ").trim(),
    importance: Number(item.importance)
  }));

  const formatPct = (val) => (Number(val) * 100).toFixed(1) + "%";

  return (
    <div className="model-insights-page fade-in" style={{ animation: 'fadeInUp 0.4s ease' }}>
      <svg style={{ height: 0, width: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="primaryGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.95} />
          </linearGradient>
        </defs>
      </svg>

      <div className="page-header">
        <h2>Model Evaluation & Insights</h2>
        <p>Performance comparison across all five classification algorithms evaluated during training.</p>
      </div>

      {/* Winning Algorithm Summary Cards */}
      <section className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>
              Active Production Model
            </div>
            <h3 style={{ color: 'var(--primary)', fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              {selected_model}
            </h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
              This model was dynamically selected as the best performing algorithm on the customer churn dataset based on Cross-Validated F1 Score.
            </p>
          </div>
          <div style={{ flex: 2, minWidth: '320px' }}>
            <div className="metrics-row">
              <div className="metric-card">
                <div className="metric-card-label">Accuracy</div>
                <div className="metric-card-value">{formatPct(data.metrics?.Accuracy)}</div>
              </div>
              <div className="metric-card">
                <div className="metric-card-label">Precision</div>
                <div className="metric-card-value">{formatPct(data.metrics?.Precision)}</div>
              </div>
              <div className="metric-card">
                <div className="metric-card-label">Recall</div>
                <div className="metric-card-value">{formatPct(data.metrics?.Recall)}</div>
              </div>
              <div className="metric-card">
                <div className="metric-card-label">F1-Score</div>
                <div className="metric-card-value">{formatPct(data.metrics?.F1)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">Algorithm Performance Comparison</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1 Score</th>
                <th>ROC-AUC</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map(m => (
                <tr key={m.name} className={m.name === selected_model ? "highlight" : ""}>
                  <td>
                    <strong>{m.name}</strong> 
                    {m.name === selected_model && " (Selected)"}
                  </td>
                  <td>{formatPct(m.Accuracy)}</td>
                  <td>{formatPct(m.Precision)}</td>
                  <td>{formatPct(m.Recall)}</td>
                  <td><strong>{formatPct(m.F1)}</strong></td>
                  <td>{formatPct(m.ROC_AUC)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="charts-grid">
        {/* Top 10 Feature Importance */}
        <section className="card">
          <div className="card-header">Top 10 Feature Importance ({selected_model})</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" tickFormatter={val => `${(val * 100).toFixed(0)}%`} tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="feature" width={120} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'var(--border)', opacity: 0.15 }} content={<CustomTooltip />} />
              <Bar dataKey="importance" fill="url(#primaryGrad)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Heatmap Confusion Matrix */}
        <section className="card">
          <div className="card-header">Confusion Matrix ({selected_model})</div>
          <div className="heatmap-grid">
            {/* Header row */}
            <div></div>
            <div className="heatmap-hdr">Predicted Negative</div>
            <div className="heatmap-hdr">Predicted Positive</div>

            {/* Negatives row */}
            <div className="heatmap-label">Actual Neg</div>
            <div className="heatmap-cell correct">
              <span>True Negative (TN)</span>
              <strong>{confusion_matrix.TN ?? 'N/A'}</strong>
            </div>
            <div className="heatmap-cell incorrect">
              <span>False Positive (FP)</span>
              <strong>{confusion_matrix.FP ?? 'N/A'}</strong>
            </div>

            {/* Positives row */}
            <div className="heatmap-label">Actual Pos</div>
            <div className="heatmap-cell incorrect">
              <span>False Negative (FN)</span>
              <strong>{confusion_matrix.FN ?? 'N/A'}</strong>
            </div>
            <div className="heatmap-cell correct">
              <span>True Positive (TP)</span>
              <strong>{confusion_matrix.TP ?? 'N/A'}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}