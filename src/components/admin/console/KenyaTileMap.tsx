import { useMemo, useState } from 'react';
import { KENYA_TILE_GRID } from '../../../../convex/lib/kenya';
import { cn } from '@/lib/utils';

const TILE = 52;
const GAP = 6;
const COLS = 9;
const ROWS = 9;
const W = COLS * (TILE + GAP) + GAP;
const H = ROWS * (TILE + GAP) + GAP;

/** Fill for a count: 5 steps of the brand orange; zero stays neutral. */
function fillFor(count: number, max: number): { fill: string; ink: string } {
  if (count === 0 || max === 0) return { fill: 'hsl(220 14% 84%)', ink: 'hsl(220 12% 34%)' };
  const t = count / max;
  if (t > 0.75) return { fill: 'hsl(14 88% 34%)', ink: '#fff' };
  if (t > 0.5) return { fill: 'hsl(14 88% 44%)', ink: '#fff' };
  if (t > 0.25) return { fill: 'hsl(14 90% 62%)', ink: 'hsl(220 15% 12%)' };
  if (t > 0.1) return { fill: 'hsl(14 95% 76%)', ink: 'hsl(220 15% 12%)' };
  return { fill: 'hsl(14 100% 88%)', ink: 'hsl(220 15% 12%)' };
}

const abbr = (name: string) => (name.length <= 6 ? name : name.replace(/-.*/, '').slice(0, 5) + '.');

/**
 * Tile-grid cartogram of Kenya's 47 counties: equal-sized tiles placed roughly where each
 * county sits (not to scale), coloured by count. Click a tile to select it.
 */
export function KenyaTileMap({
  counts,
  selected,
  onSelect,
  unit = 'total',
}: {
  counts: { county: string; count: number }[];
  selected?: string | null;
  onSelect?: (county: string | null) => void;
  unit?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const byCounty = useMemo(() => new Map(counts.map((c) => [c.county, c.count])), [counts]);
  const max = Math.max(0, ...counts.map((c) => c.count));
  const total = counts.reduce((a, b) => a + b.count, 0);

  const hoverCount = hover ? byCounty.get(hover) ?? 0 : 0;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-auto w-full max-w-[560px]" role="group" aria-label="Map of Kenya counties by count. Each square is one county.">
        {Object.entries(KENYA_TILE_GRID).map(([county, [c, r]]) => {
          const count = byCounty.get(county) ?? 0;
          const { fill, ink } = fillFor(count, max);
          const x = GAP + c * (TILE + GAP);
          const y = GAP + r * (TILE + GAP);
          const isSel = selected === county;
          return (
            <g
              key={county}
              tabIndex={0}
              role="button"
              aria-pressed={isSel}
              aria-label={`${county}: ${count} ${unit}${total ? `, ${Math.round((count / total) * 100)} percent` : ''}`}
              onMouseEnter={() => setHover(county)}
              onMouseLeave={() => setHover((h) => (h === county ? null : h))}
              onFocus={() => setHover(county)}
              onBlur={() => setHover((h) => (h === county ? null : h))}
              onClick={() => onSelect?.(isSel ? null : county)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect?.(isSel ? null : county);
                }
              }}
              className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-[hsl(220_15%_13%)] [&:focus-visible>rect]:stroke-[3]"
            >
              <rect x={x} y={y} width={TILE} height={TILE} rx={10} fill={fill} stroke={isSel ? 'hsl(220 15% 13%)' : 'transparent'} strokeWidth={isSel ? 3 : 0} />
              <text x={x + TILE / 2} y={y + TILE / 2 - 3} textAnchor="middle" fontSize={10} fontWeight={600} fill={ink}>
                {abbr(county)}
              </text>
              <text x={x + TILE / 2} y={y + TILE / 2 + 12} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink} className="font-mono">
                {count}
              </text>
            </g>
          );
        })}
      </svg>
      <div
        className={cn(
          'pointer-events-none absolute right-0 top-0 rounded-xl border border-border bg-[hsl(var(--popover))] px-3 py-2 text-sm shadow-md transition-opacity',
          hover ? 'opacity-100' : 'opacity-0',
        )}
        role="status"
      >
        {hover && (
          <>
            <p className="font-semibold text-foreground">{hover}</p>
            <p className="text-muted-foreground">
              {hoverCount} {unit}{total ? ` · ${Math.round((hoverCount / total) * 100)}% of mapped` : ''}
            </p>
          </>
        )}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground" aria-hidden="true">
        <span>Fewer</span>
        {[0, 0.05, 0.2, 0.4, 0.6, 0.9].map((t) => (
          <span key={t} className="h-3 w-6 rounded" style={{ background: fillFor(Math.round(t * 100), 100).fill }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
