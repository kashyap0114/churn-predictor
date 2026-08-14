import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--primary)'}}><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></svg>
        CHURN PREDICTOR
      </div>
      <div className="nav-links">
        <NavLink to="/" className={({isActive}) => isActive ? "active" : ""}>Overview</NavLink>
        <NavLink to="/predict" className={({isActive}) => isActive ? "active" : ""}>Customer Risk</NavLink>
        <NavLink to="/insights" className={({isActive}) => isActive ? "active" : ""}>Model Insights</NavLink>
      </div>
    </nav>
  );
}