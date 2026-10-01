import type { ReactNode } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Skeleton } from './primitives';

const BRAND = 'hsl(14 88% 44%)';
const INK = 'hsl(220 15% 25%)';
const GRID = 'hsl(220 14% 78%)';
const AXIS = 'hsl(220 12% 38%)';

/** Tiny inline trend line for KPI tiles. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const w = 96;
  const h = 32;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 3 - ((v - min) / span) * (h - 6)}`);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('h-8 w-24', className)} role="img" aria-label={`Trend: ${values.join(', ')}`}>
      <polyline points={pts.join(' ')} fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.at(-1)!.split(',')[0]} cy={pts.at(-1)!.split(',')[1]} r="2.5" fill={BRAND} />
    </svg>
  );
}

export function KpiTile({
  label,
  value,
  sub,
  icon,
  spark,
  loading,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  spark?: number[];
  loading?: boolean;
  tone?: 'default' | 'attention';
}) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-5', tone === 'attention' && 'ring-2 ring-[hsl(var(--brand-strong))]/40')}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground" aria-hidden="true">{icon}</span>}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-24" />
      ) : (
        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="font-mono text-3xl font-semibold text-foreground" data-analytics>{value}</p>
          {spark && <Sparkline values={spark} />}
        </div>
      )}
      {sub && !loading && <p className="mt-1.5 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Area chart for one or two series over time. */
export function AreaTrend({
  data,
  xKey,
  series,
  height = 260,
  xFormatter,
}: {
  data: Record<string, number | string>[];
  xKey: string;
  series: { key: string; label: string; color?: string }[];
  height?: number;
  xFormatter?: (v: string) => string;
}) {
  return (
    <div style={{ height }} className="w-full" role="img" aria-label={`Chart: ${series.map((s) => s.label).join(' and ')} over time`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color ?? (i === 0 ? BRAND : INK)} stopOpacity={0.35} />
                <stop offset="100%" stopColor={s.color ?? (i === 0 ? BRAND : INK)} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tickFormatter={xFormatter} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            labelFormatter={xFormatter as never}
            contentStyle={{ borderRadius: 12, border: '1px solid hsl(220 14% 70%)', background: 'hsl(220 16% 94%)', fontSize: 13 }}
          />
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? (i === 0 ? BRAND : INK)}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ColumnBars({
  data,
  xKey,
  yKey,
  label,
  height = 220,
  xFormatter,
}: {
  data: Record<string, number | string>[];
  xKey: string;
  yKey: string;
  label: string;
  height?: number;
  xFormatter?: (v: string) => string;
}) {
  return (
    <div style={{ height }} className="w-full" role="img" aria-label={`Chart: ${label}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tickFormatter={xFormatter} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis allowDecimals={false} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            labelFormatter={xFormatter as never}
            cursor={{ fill: 'hsl(220 14% 80% / 0.5)' }}
            contentStyle={{ borderRadius: 12, border: '1px solid hsl(220 14% 70%)', background: 'hsl(220 16% 94%)', fontSize: 13 }}
          />
          <Bar dataKey={yKey} name={label} fill={BRAND} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Ranked horizontal bars built from plain elements (accessible, prints well). */
export function BarList({
  items,
  total,
  empty = 'No data yet',
  valueLabel,
}: {
  items: { name: string; count: number; extra?: string }[];
  total?: number;
  empty?: string;
  valueLabel?: (i: { name: string; count: number }) => string;
}) {
  if (items.length === 0) return <p className="py-4 text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(...items.map((i) => i.count), 1);
  const sum = total ?? items.reduce((a, b) => a + b.count, 0);
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.name}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-foreground">{i.name}</span>
            <span className="shrink-0 font-mono text-muted-foreground">
              {valueLabel ? valueLabel(i) : `${i.count.toLocaleString('en-GB')}${sum ? ` · ${Math.round((i.count / sum) * 100)}%` : ''}`}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
            <div className="h-full rounded-full bg-[hsl(var(--brand-strong))]" style={{ width: `${(i.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Usage-vs-limit meter. `limit` undefined/null means unlimited. */
export function Gauge({ label, used, limit }: { label: string; used: number; limit?: number | null }) {
  const unlimited = limit === undefined || limit === null;
  const pct = unlimited ? 0 : limit === 0 ? 100 : Math.min(100, Math.round((used / limit) * 100));
  const tone = pct >= 100 ? 'bg-red-600' : pct >= 80 ? 'bg-amber-500' : 'bg-[hsl(var(--brand-strong))]';
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{unlimited ? `${used} · no limit` : `${used} / ${limit}`}</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={unlimited ? undefined : limit ?? 0}
        aria-valuenow={used}
        className="h-2.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]"
      >
        <div className={cn('h-full rounded-full transition-all', unlimited ? 'bg-[hsl(var(--muted-foreground))]/40' : tone)} style={{ width: unlimited ? '8%' : `${pct}%` }} />
      </div>
    </div>
  );
}
