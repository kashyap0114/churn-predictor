export default function StatCard({ title, value, isCurrency, isPercentage }) {
  const formattedValue = isCurrency ? `$${value}` : isPercentage ? `${value}` : value;

  // Select icon and color accent based on the title
  const getCardDetails = () => {
    switch (title) {
      case "Total Customers":
        return {
          accentClass: "",
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          )
        };
      case "Churned Customers":
        return {
          accentClass: "churn",
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--danger)' }}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="17" y1="8" x2="23" y2="14" />
              <line x1="23" y1="8" x2="17" y2="14" />
            </svg>
          )
        };
      case "Overall Churn Rate":
        return {
          accentClass: "churn",
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--warning)' }}>
              <path d="M23 6l-9.5 9.5-5-5L1 18" />
              <path d="M17 6h6v6" />
            </svg>
          )
        };
      case "Avg Monthly Charges":
        return {
          accentClass: "retention",
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--success)' }}>
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          )
        };
      default:
        return {
          accentClass: "",
          icon: null
        };
    }
  };

  const { accentClass, icon } = getCardDetails();

  return (
    <div className="card">
      <div className={`kpi-accent ${accentClass}`}></div>
      <div className="card-header">
        <span>{title}</span>
        {icon && <div style={{ display: 'flex', alignItems: 'center' }}>{icon}</div>}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.25rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.25rem' }}>
        {formattedValue}
      </div>
    </div>
  );
}