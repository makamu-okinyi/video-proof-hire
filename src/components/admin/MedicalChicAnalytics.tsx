import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

const GAUGE_R = 48;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_R;

/** System Health circular gauge (7/10 mood tracker style) */
export function SystemHealthGauge({ value, max = 10, label = 'Application Success Rate' }: { value: number; max?: number; label?: string }) {
  const pct = Math.min(1, Math.max(0, value / max));
  const strokeDashoffset = GAUGE_CIRCUMFERENCE * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={GAUGE_R} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
          <circle
            cx="60"
            cy="60"
            r="48"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-emerald-500 transition-all duration-500"
            strokeDasharray={GAUGE_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold text-charcoal dark:text-charcoal">{Math.round(value)}</span>
          <span className="font-mono text-xs text-cool-grey">/ {max}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-cool-grey">{label}</span>
    </div>
  );
}

/** Engagement Flux - thin line chart for Daily Active Applicants */
export function EngagementFluxChart({ data }: { data: { date: string; applicants: number }[] }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
          <XAxis
            dataKey="date"
            tick={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}
            stroke="hsl(var(--cool-grey))"
          />
          <YAxis
            tick={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}
            stroke="hsl(var(--cool-grey))"
          />
          <Tooltip
            contentStyle={{
              fontFamily: 'JetBrains Mono',
              fontSize: 12,
              borderRadius: '2px',
            }}
            formatter={(value: number) => [value, 'Applicants']}
          />
          <Line
            type="monotone"
            dataKey="applicants"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Metric card - habit-style horizontal progress bar */
export function MetricCard({
  label,
  value,
  max = 100,
  change,
  className,
}: {
  label: string;
  value: number;
  max?: number;
  change?: number;
  className?: string;
}) {
  const pct = Math.min(1, Math.max(0, value / max));

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-charcoal dark:text-charcoal">{label}</span>
        <span className="font-mono text-sm text-cool-grey">
          {Math.round(pct * 100)}%
          {change !== undefined && (
            <span className={cn('ml-2', change >= 0 ? 'text-emerald-500' : 'text-red-500')}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          )}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-[2px] bg-muted/50">
        <div
          className="h-full rounded-[2px] bg-emerald-500 transition-all duration-500"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}
