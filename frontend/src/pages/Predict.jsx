import { useState, useEffect } from 'react';
import axios from 'axios';
import PredictionResult from '../components/PredictionResult';

const API_URL = 'http://localhost:8000';

const DEFAULT_FORM = {
  Contract: 'Month-to-month', tenure: '12', InternetService: 'Fiber optic', OnlineSecurity: 'No',
  TechSupport: 'No', PaymentMethod: 'Electronic check', MultipleLines: 'No', Dependents: 'No',
  StreamingMovies: 'No', StreamingTV: 'No', OnlineBackup: 'No', PaperlessBilling: 'Yes'
};

export default function Predict() {
  const [mode, setMode] = useState('existing');
  const [modelName, setModelName] = useState('selected');
  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerProfile, setCustomerProfile] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/api/customers`).then(res => setAllCustomers(res.data)).catch(() => setError('Could not load customers.'));
    // Pull the actual winning model name instead of hardcoding it in the copy below.
    axios.get(`${API_URL}/api/model-performance`).then(res => setModelName(res.data.selected_model)).catch(() => {});
  }, []);

  const selectCustomer = async (id) => {
    setSelectedCustomerId(id); setCustomerProfile(null); setResult(null); setError('');
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/customers/${encodeURIComponent(id)}`);
      setCustomerProfile(res.data);
    } catch (err) { setError(err.response?.data?.detail || 'Failed to load profile.'); }
    finally { setLoading(false); }
  };

  const handlePredict = async (e, isManual = false) => {
    if (e) e.preventDefault();
    setLoading(true); setResult(null); setError('');
    try {
      let payload = isManual ? { ...formData, tenure: Number(formData.tenure) } : {
        Contract: customerProfile['Contract'], InternetService: customerProfile['Internet Service'],
        OnlineSecurity: customerProfile['Online Security'], TechSupport: customerProfile['Tech Support'],
        PaymentMethod: customerProfile['Payment Method'], MultipleLines: customerProfile['Multiple Lines'],
        Dependents: customerProfile['Dependents'], StreamingMovies: customerProfile['Streaming Movies'],
        StreamingTV: customerProfile['Streaming TV'], tenure: Number(customerProfile['Tenure Months']),
        OnlineBackup: customerProfile['Online Backup'], PaperlessBilling: customerProfile['Paperless Billing']
      };
      const res = await axios.post(`${API_URL}/api/predict`, payload);
      setResult({ ...res.data, prediction_mode: isManual ? 'Manual Assessment' : 'Existing Customer', customer_id: customerProfile?.customer_id });
    } catch (err) { setError(err.response?.data?.detail || 'Prediction failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Customer Risk Assessment</h2>
        <p>Evaluate customer churn risk using the finalized 12-feature {modelName} model.</p>
      </div>

      <div className="tabs">
        <button className={`tab ${mode === 'existing' ? 'active' : ''}`} onClick={() => { setMode('existing'); setResult(null); setError(''); }}>Existing Customer</button>
        <button className={`tab ${mode === 'manual' ? 'active' : ''}`} onClick={() => { setMode('manual'); setResult(null); setError(''); }}>Manual Assessment</button>
      </div>

      {error && <div className="card" style={{ background: '#fee2e2', color: '#991b1b', marginBottom: '1.5rem', padding: '1rem' }}><strong>Error: </strong>{error}</div>}

      <div className="charts-grid" style={{ gridTemplateColumns: '1.2fr 1fr', alignItems: 'start' }}>
        {mode === 'existing' ? (
          <div className="card">
            <div className="card-header">Search Customer Database</div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Select Customer ID</label>
              <select className="form-control" value={selectedCustomerId} onChange={e => selectCustomer(e.target.value)}>
                <option value="">-- Choose a Customer --</option>
                {allCustomers.map(id => <option key={id} value={id}>{id}</option>)}
              </select>
            </div>
            {customerProfile && (
              <div className="profile-display">
                <div className="card-header">Customer Profile: <span style={{ fontFamily: 'var(--font-mono)' }}>{customerProfile.customer_id}</span></div>
                <div className="profile-display-grid">
                  {Object.entries(customerProfile).map(([key, val]) => key !== 'customer_id' && (
                    <div className="profile-item" key={key}><label>{key}</label><span>{val}</span></div>
                  ))}
                </div>
              </div>
            )}
            <button className="btn" onClick={() => handlePredict(null, false)} disabled={!customerProfile || loading}>
              {loading ? 'Running...' : 'Analyze Churn Risk'}
            </button>
          </div>
        ) : (
          <form className="card" onSubmit={e => handlePredict(e, true)}>
            <div className="card-header">Customer Attributes</div>
            <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
              {Object.keys(DEFAULT_FORM).map(key => (
                <div className="form-group" key={key}>
                  <label>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                  {key === 'tenure' ? (
                    <input className="form-control" type="number" name={key} value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })} required />
                  ) : (
                    <select className="form-control" name={key} value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })}>
                       {['Contract'].includes(key) && <><option>Month-to-month</option><option>One year</option><option>Two year</option></>}
                       {['PaymentMethod'].includes(key) && <><option>Electronic check</option><option>Mailed check</option><option>Bank transfer (automatic)</option><option>Credit card (automatic)</option></>}
                       {['InternetService'].includes(key) && <><option>Fiber optic</option><option>DSL</option><option>No</option></>}
                       {!['Contract', 'PaymentMethod', 'InternetService'].includes(key) && <><option>Yes</option><option>No</option></>}
                    </select>
                  )}
                </div>
              ))}
            </div>
            <button type="submit" className="btn" disabled={loading}>{loading ? 'Running...' : 'Predict Churn Risk'}</button>
          </form>
        )}

        {loading ? (
          <div className="state-box"><div className="loading-spinner"></div><p>Analyzing...</p></div>
        ) : result ? (
          <PredictionResult result={result} onReset={() => setResult(null)} />
        ) : (
          <div className="state-box"><h4>READY TO ANALYZE</h4><p>Select an existing customer or enter a profile manually.</p></div>
        )}
      </div>
    </div>
  );
}