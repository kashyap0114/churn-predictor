import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDashboard = () => {
    setLoading(true); setError(false);
    axios.get('http://localhost:8000/api/dashboard')
      .then((res) => { setData(res.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) return (
    <div className="state-box">
      <div className="loading-spinner"></div>
      <p>Aggregating dashboard analytics...</p>
    </div>
  );

  if (error || !data) return (
    <div className="state-box">
      <p>Unable to load dashboard data. The backend API may be unavailable.</p>
      <button className="btn btn-outline" style={{width: 'auto', marginTop: '1rem'}} onClick={fetchDashboard}>Retry Connection</button>
    </div>
  );

  const churnPieData = [
    { name: 'Retained', value: data.kpis["Total Customers"] - data.kpis["Churned Customers"] },
    { name: 'Churned', value: data.kpis["Churned Customers"] }
  ];
  const COLORS = ['var(--success)', 'var(--danger)'];

  // Dynamic Insights generator
  const getInsights = () => {
    const highestContract = [...data.charts.churn_by_contract].sort((a,b) => b.churn_rate - a.churn_rate)[0];
    const highestTenure = [...data.charts.churn_by_tenure].sort((a,b) => b.churn_rate - a.churn_rate)[0];
    
    return (
      <div className="insights-box">
        <h4>Key Insights</h4>
        <p><span>⚠</span> <strong>Contract Risk:</strong> {highestContract.name} customers show the highest churn rate at {highestContract.churn_rate}%.</p>
        <p><span>⚠</span> <strong>Tenure Risk:</strong> Customers in the {highestTenure.name} group require closer retention tracking.</p>
        <p><span>✓</span> <strong>Retention Opportunity:</strong> Long-term contracts and bundled tech support show significantly stronger retention profiles.</p>
      </div>
    );
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div className="page-header">
        <h2>Customer Churn Overview</h2>
        <p>Monitor customer retention and identify the major drivers of churn across the network.</p>
      </div>
      
      <div className="kpi-grid">
        <StatCard title="Total Customers" value={data.kpis["Total Customers"].toLocaleString()} />
        <StatCard title="Churned Customers" value={data.kpis["Churned Customers"].toLocaleString()} />
        <StatCard title="Overall Churn Rate" value={data.kpis["Churn Rate"]} isPercentage />
        <StatCard title="Avg Monthly Charges" value={data.kpis["Avg Monthly Charges"].replace('$','')} isCurrency />
      </div>
      
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">Churn Distribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={churnPieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value">
                {churnPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => [value.toLocaleString(), 'Customers']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">Churn Rate by Contract Type (%)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.charts.churn_by_contract} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
              <Tooltip cursor={{fill: 'var(--bg)'}} />
              <Bar dataKey="churn_rate" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">Churn Rate by Internet Service (%)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.charts.churn_by_internet} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
              <Tooltip cursor={{fill: 'var(--bg)'}} />
              <Bar dataKey="churn_rate" fill="#0369a1" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">Churn Rate by Customer Tenure (%)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.charts.churn_by_tenure} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
              <Tooltip cursor={{fill: 'var(--bg)'}} />
              <Bar dataKey="churn_rate" fill="#4338ca" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {getInsights()}
    </div>
  );
}