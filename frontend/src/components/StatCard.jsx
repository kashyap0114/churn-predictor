export default function StatCard({ title, value, isCurrency, isPercentage }) {
  const formattedValue = isCurrency ? `$${value}` : isPercentage ? `${value}` : value;
  
  return (
    <div className="card">
      <div className="card-header">{title}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: '600', color: 'var(--text-main)' }}>
        {formattedValue}
      </div>
    </div>
  );
}