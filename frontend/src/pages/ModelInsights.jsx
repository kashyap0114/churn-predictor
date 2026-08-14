import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const API_URL = "http://localhost:8000/api";

export default function ModelInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`${API_URL}/model-performance`)
      .then(res => setData(res.data))
      .catch(err => setError("Could not load model performance."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="state-box"><div className="loading-spinner"></div></div>;
  if (error || !data) return <div className="state-box"><p>{error}</p></div>;

  const { selected_model = "the selected model", models = {}, feature_importance = [], confusion_matrix = {} } = data;
  
  const comparisonData = Object.entries(models).map(([name, metrics]) => ({
    name, Accuracy: metrics.Accuracy || 0, Precision: metrics.Precision || 0,
    Recall: metrics.Recall || 0, F1: metrics.F1 || 0, ROC_AUC: metrics["ROC-AUC"] || 0
  }));

  const chartData = feature_importance.slice(0, 10).map(item => ({
    feature: item.feature.replace(/^cat__|num__|_/g, " ").trim(),
    importance: Number(item.importance)
  }));

  const formatPct = (val) => (Number(val) * 100).toFixed(1) + "%";

  return (
    <div className="model-insights-page fade-in">
      <div className="page-header">
        <h2>Model Evaluation & Insights</h2>
        <p>Performance comparison across all five classification algorithms.</p>
      </div>

      <section className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">Algorithm Comparison</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Model</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1 Score</th><th>ROC-AUC</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map(m => (
                <tr key={m.name} className={m.name === selected_model ? "highlight" : ""}>
                  <td><strong>{m.name}</strong> {m.name === selected_model && " (Selected)"}</td>
                  <td>{formatPct(m.Accuracy)}</td><td>{formatPct(m.Precision)}</td>
                  <td>{formatPct(m.Recall)}</td><td><strong>{formatPct(m.F1)}</strong></td>
                  <td>{formatPct(m.ROC_AUC)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="charts-grid">
        <section className="card">
          <div className="card-header">Top 10 Feature Importance ({selected_model})</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={val => `${(val * 100).toFixed(0)}%`} />
              <YAxis type="category" dataKey="feature" width={120} tick={{ fontSize: 12 }} />
              <Tooltip formatter={val => [`${(Number(val) * 100).toFixed(2)}%`, "Importance"]} />
              <Bar dataKey="importance" fill="var(--primary)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="card">
          <div className="card-header">Confusion Matrix ({selected_model})</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '10px', textAlign: 'center', marginTop: '2rem' }}>
             <div></div><div style={{fontWeight: 'bold'}}>Predicted Negative</div><div style={{fontWeight: 'bold'}}>Predicted Positive</div>
             <div style={{fontWeight: 'bold'}}>Actual Negative</div>
             <div style={{background: '#f0fdfa', padding: '1.5rem', border: '1px solid var(--border)'}}>TN: {confusion_matrix.TN || 'N/A'}</div>
             <div style={{background: '#fee2e2', padding: '1.5rem', border: '1px solid var(--border)'}}>FP: {confusion_matrix.FP || 'N/A'}</div>
             <div style={{fontWeight: 'bold'}}>Actual Positive</div>
             <div style={{background: '#fee2e2', padding: '1.5rem', border: '1px solid var(--border)'}}>FN: {confusion_matrix.FN || 'N/A'}</div>
             <div style={{background: '#f0fdfa', padding: '1.5rem', border: '1px solid var(--border)'}}>TP: {confusion_matrix.TP || 'N/A'}</div>
          </div>
        </section>
      </div>
    </div>
  );
}