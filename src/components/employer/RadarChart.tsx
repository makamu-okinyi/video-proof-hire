/** Dependency-free radar chart. Values run 0 to `max`; a null value is drawn as an empty axis. */
export function RadarChart({
  axes,
  max = 5,
  size = 240,
}: {
  axes: { label: string; value: number | null }[];
  max?: number;
  size?: number;
}) {
  const c = size / 2;
  const r = size / 2 - 38;
  const n = axes.length;
  const point = (i: number, frac: number) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [c + Math.cos(angle) * r * frac, c + Math.sin(angle) * r * frac] as const;
  };
  const ring = (frac: number) => axes.map((_, i) => point(i, frac).join(',')).join(' ');
  const shape = axes.map((a, i) => point(i, Math.max(0, Math.min(1, (a.value ?? 0) / max))).join(',')).join(' ');
  const summary = axes.map((a) => `${a.label} ${a.value ?? 'not rated'}`).join(', ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }} role="img" aria-label={`Radar chart. ${summary}`}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, 1);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="hsl(var(--border))" strokeWidth="1" />;
      })}
      <polygon points={shape} fill="hsl(var(--primary) / 0.22)" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinejoin="round" />
      {axes.map((a, i) => {
        const [x, y] = point(i, 1.2);
        const anchor = x < c - 4 ? 'end' : x > c + 4 ? 'start' : 'middle';
        return (
          <text key={a.label} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}
