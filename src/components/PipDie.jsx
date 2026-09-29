// Petit dé à points (2D) animé, réutilisable dans les jeux
const PIPS = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]]
};

export default function PipDie({ value = 1, rolling = false, size = 54, color = "#f8f4ea", ink = "#1f2937" }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`pipDie ${rolling ? "tumbling" : "landed"}`}>
      <rect x="4" y="4" width="92" height="92" rx="20" fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth="2" />
      <rect x="4" y="4" width="92" height="92" rx="20" fill="url(#pipShade)" />
      <defs>
        <radialGradient id="pipShade" cx="30%" cy="25%" r="90%">
          <stop offset="0" stopColor="rgba(255,255,255,0.5)" />
          <stop offset="1" stopColor="rgba(0,0,0,0.18)" />
        </radialGradient>
      </defs>
      {(PIPS[value] || PIPS[1]).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="9" fill={value === 1 ? "#c1121f" : ink} />
      ))}
    </svg>
  );
}
