// Shared "signal strength" glyph — used as the navbar logomark (always full)
// and as the risk-level indicator on prediction results (1-3 bars filled).
export default function SignalBars({ level = 3, className = '' }) {
  return (
    <svg
      className={`signal-bars ${className}`}
      width="20"
      height="16"
      viewBox="0 0 28 20"
      aria-hidden="true"
    >
      {[1, 2, 3].map((bar) => (
        <rect
          key={bar}
          className={bar <= level ? 'bar bar--on' : 'bar'}
          x={(bar - 1) * 10}
          y={20 - bar * 6}
          width="6"
          height={bar * 6}
          rx="1.5"
        />
      ))}
    </svg>
  );
}