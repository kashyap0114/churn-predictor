import { useState, useEffect } from 'react';
import axios from 'axios';
import PredictionResult from '../components/PredictionResult';

const API_URL = 'http://localhost:8000';

const DEFAULT_FORM = {
  Contract: 'Month-to-month', 
  tenure: '12', 
  InternetService: 'Fiber optic', 
  OnlineSecurity: 'No',
  TechSupport: 'No', 
  PaymentMethod: 'Electronic check', 
  MultipleLines: 'No', 
  Dependents: 'No',
  StreamingMovies: 'No', 
  StreamingTV: 'No', 
  OnlineBackup: 'No', 
  PaperlessBilling: 'Yes'
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
    axios.get(`${API_URL}/api/customers`)
      .then(res => setAllCustomers(res.data))
      .catch(() => setError('Could not load customer database.'));

    axios.get(`${API_URL}/api/model-performance`)
      .then(res => setModelName(res.data.selected_model))
      .catch(() => {});
  }, []);

  const selectCustomer = async (id) => {
    setSelectedCustomerId(id); 
    setCustomerProfile(null); 
    setResult(null); 
    setError('');
    
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/customers/${encodeURIComponent(id)}`);
      setCustomerProfile(res.data);
    } catch (err) { 
      setError(err.response?.data?.detail || 'Failed to load customer profile.'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handlePredict = async (e, isManual = false) => {
    if (e) e.preventDefault();
    setLoading(true); 
    setResult(null); 
    setError('');
    
    try {
      let payload = isManual ? { ...formData, tenure: Number(formData.tenure) } : {
        Contract: customerProfile['Contract'], 
        InternetService: customerProfile['Internet Service'],
        OnlineSecurity: customerProfile['Online Security'], 
        TechSupport: customerProfile['Tech Support'],
        PaymentMethod: customerProfile['Payment Method'], 
        MultipleLines: customerProfile['Multiple Lines'],
        Dependents: customerProfile['Dependents'], 
        StreamingMovies: customerProfile['Streaming Movies'],
        StreamingTV: customerProfile['Streaming TV'], 
        tenure: Number(customerProfile['Tenure Months']),
        OnlineBackup: customerProfile['Online Backup'], 
        PaperlessBilling: customerProfile['Paperless Billing']
      };
      
      const res = await axios.post(`${API_URL}/api/predict`, payload);
      setResult({ 
        ...res.data, 
        prediction_mode: isManual ? 'Manual Assessment' : 'Existing Customer', 
        customer_id: customerProfile?.customer_id 
      });
    } catch (err) { 
      setError(err.response?.data?.detail || 'Prediction failed.'); 
    } finally { 
      setLoading(false); 
    }
  };

  const renderTogglePill = (key, label) => {
    return (
      <div className="form-group" key={key}>
        <label>{label}</label>
        <div className="toggle-pill-group">
          {['Yes', 'No'].map(val => (
            <button
              key={val}
              type="button"
              className={`toggle-pill-btn ${formData[key] === val ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, [key]: val })}
            >
              {val}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Customer Churn Risk Assessment</h2>
        <p>Evaluate customer retention probability using the production-ready 12-feature {modelName} model.</p>
      </div>

      <div className="tabs">
        <button className={`tab ${mode === 'existing' ? 'active' : ''}`} onClick={() => { setMode('existing'); setResult(null); setError(''); }}>Database Search</button>
        <button className={`tab ${mode === 'manual' ? 'active' : ''}`} onClick={() => { setMode('manual'); setResult(null); setError(''); }}>Manual Simulator</button>
      </div>

      {error && (
        <div className="card" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', border: '1px solid var(--danger)', marginBottom: '1.5rem', padding: '1rem', borderRadius: '8px' }}>
          <strong>Error: </strong>{error}
        </div>
      )}

      <div className="charts-grid" style={{ gridTemplateColumns: '1.25fr 1fr', alignItems: 'start' }}>
        {mode === 'existing' ? (
          <div className="card">
            <div className="card-header">Select Database Profile</div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Select Customer Reference ID</label>
              <select className="form-control" value={selectedCustomerId} onChange={e => selectCustomer(e.target.value)}>
                <option value="">-- Search Customer IDs --</option>
                {allCustomers.map(id => <option key={id} value={id}>{id}</option>)}
              </select>
            </div>
            
            {customerProfile && (
              <div className="profile-display">
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>
                  Loaded Profile: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{customerProfile.customer_id}</span>
                </div>
                <div className="profile-display-grid">
                  {Object.entries(customerProfile).map(([key, val]) => key !== 'customer_id' && (
                    <div className="profile-item" key={key}>
                      <label>{key}</label>
                      <span>{val?.toString() || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button className="btn" onClick={() => handlePredict(null, false)} disabled={!customerProfile || loading}>
              {loading ? 'Running Risk Inference...' : 'Calculate Retention Risk'}
            </button>
          </div>
        ) : (
          <form className="card" onSubmit={e => handlePredict(e, true)}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              Define Customer Profile
            </div>

            {/* Section 1: Demographics & Contract */}
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.5px' }}>
              1. Demographics & Contract
            </div>
            <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
              {renderTogglePill('Dependents', 'Has Dependents')}
              <div className="form-group">
                <label>Contract Type</label>
                <select className="form-control" value={formData.Contract} onChange={e => setFormData({ ...formData, Contract: e.target.value })}>
                  <option>Month-to-month</option>
                  <option>One year</option>
                  <option>Two year</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tenure Months</label>
                <input className="form-control" type="number" min="0" max="120" value={formData.tenure} onChange={e => setFormData({ ...formData, tenure: e.target.value })} required />
              </div>
            </div>

            {/* Section 2: Billing & Payments */}
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.5px' }}>
              2. Billing & Payments
            </div>
            <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Payment Method</label>
                <select className="form-control" value={formData.PaymentMethod} onChange={e => setFormData({ ...formData, PaymentMethod: e.target.value })}>
                  <option>Electronic check</option>
                  <option>Mailed check</option>
                  <option>Bank transfer (automatic)</option>
                  <option>Credit card (automatic)</option>
                </select>
              </div>
              {renderTogglePill('PaperlessBilling', 'Paperless Billing')}
            </div>

            {/* Section 3: Services & Subscriptions */}
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.5px' }}>
              3. Network Services
            </div>
            <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Internet Service</label>
                <select className="form-control" value={formData.InternetService} onChange={e => setFormData({ ...formData, InternetService: e.target.value })}>
                  <option>Fiber optic</option>
                  <option>DSL</option>
                  <option>No</option>
                </select>
              </div>
              {renderTogglePill('MultipleLines', 'Multiple Lines')}
              {renderTogglePill('OnlineSecurity', 'Online Security')}
              {renderTogglePill('OnlineBackup', 'Online Backup')}
              {renderTogglePill('TechSupport', 'Tech Support')}
              {renderTogglePill('StreamingTV', 'Streaming TV')}
              {renderTogglePill('StreamingMovies', 'Streaming Movies')}
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Running Risk Inference...' : 'Predict Churn Probability'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="state-box">
            <div className="loading-spinner"></div>
            <p>Analyzing customer profile details...</p>
          </div>
        ) : result ? (
          <PredictionResult result={result} onReset={() => setResult(null)} />
        ) : (
          <div className="state-box">
            <h4 style={{ color: 'var(--text-main)', fontWeight: 700, margin: '0 0 8px 0' }}>READY FOR ANALYSIS</h4>
            <p>Select an existing database customer or configure simulated customer attributes to run predictive modeling.</p>
          </div>
        )}
      </div>
    </div>
  );
}