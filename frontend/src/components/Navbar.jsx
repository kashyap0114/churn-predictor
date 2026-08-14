import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export default function Navbar() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [isOnline, setIsOnline] = useState(false);

  // Initialize theme
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  // Check API health status on mount and poll every 7 seconds
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/health`, { timeout: 3000 });
        if (response.data && response.data.status === 'ok') {
          setIsOnline(true);
        } else {
          setIsOnline(false);
        }
      } catch (err) {
        setIsOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 7000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          style={{ color: 'var(--primary)' }}
        >
          <path d="M2 20h.01"/>
          <path d="M7 20v-4"/>
          <path d="M12 20v-8"/>
          <path d="M17 20V8"/>
          <path d="M22 4v16"/>
        </svg>
        CHURN PREDICTOR
      </div>

      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>Overview</NavLink>
        <NavLink to="/predict" className={({ isActive }) => isActive ? "active" : ""}>Customer Risk</NavLink>
        <NavLink to="/insights" className={({ isActive }) => isActive ? "active" : ""}>Model Insights</NavLink>
      </div>

      <div className="nav-actions">
        <div className="api-status">
          <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
          <span>{isOnline ? 'API Connected' : 'API Offline'}</span>
        </div>

        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme} 
          aria-label="Toggle theme"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            // Sun Icon
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            // Moon Icon
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}