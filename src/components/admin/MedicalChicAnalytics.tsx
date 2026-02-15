import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { cn } from '@/lib/utils';

const GAUGE_R = 48;

const JETBRAINS = "'JetBrains Mono', ui-monospace, monospace";

/** Pipeline Velocity - circular gauge for average Days to Decision */
export function PipelineVelocityGauge({ daysToDecision, maxDays = 14, label = 'Avg Days to Decision' }: { daysToDecision: number; maxDays?: number; label?: string }) {
  const pct = Math.min(1, Math.max(0, daysToDecision / maxDays));
  const strokeDashoffset = 2 * Math.PI * GAUGE_R * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-3 pointer-events-auto">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={GAUGE_R} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
          <circle cx="60" cy="60" r={GAUGE_R} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-primary transition-all duration-500" strokeDasharray={2 * Math.PI * GAUGE_R} strokeDashoffset={strokeDashoffset} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-charcoal" style={{ fontFamily: JETBRAINS }}>{Math.round(daysToDecision)}</span>
          <span className="text-xs text-cool-grey" style={{ fontFamily: JETBRAINS }}>days</span>
        </div>
      </div>
      <span className="text-xs font-medium text-cool-grey">{label}</span>
    </div>
  );
}

/** Skill Radar - aggregate applicant strengths */
export function SkillRadarChart({ data }: { data: { skill: string; value: number; fullMark: number }[] }) {
  const defaultData = data.length ? data : [
    { skill: 'Tech', value: 0, fullMark: 10 },
    { skill: 'Product', value: 0, fullMark: 10 },
    { skill: 'Growth', value: 0, fullMark: 10 },
    { skill: 'Operations', value: 0, fullMark: 10 },
    { skill: 'Leadership', value: 0, fullMark: 10 },
  ];

  return (
    <div className="h-56 w-full pointer-events-auto rounded-[2px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={defaultData} margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="skill" tick={{ fontFamily: JETBRAINS, fontSize: 10 }} />
          <PolarRadiusAxis tick={{ fontFamily: JETBRAINS, fontSize: 8 }} />
          <Radar name="Strength" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} strokeWidth={2} />
          <Tooltip contentStyle={{ fontFamily: JETBRAINS, fontSize: 11, borderRadius: '2px' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Kenya regions - grid layout for heatmap */
const KENYA_REGIONS = [
  { id: 'nairobi', label: 'Nairobi', row: 0, col: 2 },
  { id: 'mombasa', label: 'Mombasa', row: 1, col: 3 },
  { id: 'kisumu', label: 'Kisumu', row: 1, col: 0 },
  { id: 'nakuru', label: 'Nakuru', row: 0, col: 1 },
  { id: 'eldoret', label: 'Eldoret', row: 0, col: 0 },
  { id: 'thika', label: 'Thika', row: 0, col: 3 },
  { id: 'meru', label: 'Meru', row: 1, col: 2 },
  { id: 'garissa', label: 'Garissa', row: 1, col: 1 },
] as const;

/** Geospatial Heatmap - applicant density across Kenya */
export function GeospatialHeatmap({ regionCounts }: { regionCounts?: Record<string, number> }) {
  const maxCount = Math.max(1, ...Object.values(regionCounts ?? {}));
  const regions = KENYA_REGIONS.map((r) => ({
    ...r,
    applicants: regionCounts?.[r.id] ?? 0,
    intensity: (regionCounts?.[r.id] ?? 0) / maxCount,
  }));

  return (
    <div className="w-full pointer-events-auto">
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-32 rounded-[2px] overflow-hidden" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)' }}>
        {regions.map((r) => (
          <div
            key={r.id}
            className="rounded-[2px] flex flex-col items-center justify-center transition-all duration-300 border border-white/50"
            style={{
              background: r.intensity > 0 ? `linear-gradient(135deg, hsl(14 100% ${55 + r.intensity * 25}%), hsl(14 90% 45%))` : 'rgba(0,0,0,0.04)',
              boxShadow: r.intensity > 0 ? '0 2px 6px rgba(0,0,0,0.12)' : 'none',
            }}
            title={`${r.label}: ${r.applicants} applicants`}
          >
            <span className="text-sm font-bold text-white drop-shadow-sm" style={{ fontFamily: JETBRAINS }}>{r.applicants}</span>
            <span className="text-[9px] text-white/90">{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_R;

/** System Health circular gauge (7/10 mood tracker style) */
export function SystemHealthGauge({ value, max = 10, label = 'Application Success Rate' }: { value: number; max?: number; label?: string }) {
  const pct = Math.min(1, Math.max(0, value / max));
  const strokeDashoffset = GAUGE_CIRCUMFERENCE * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-3 pointer-events-auto">
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
    <div className="h-48 w-full pointer-events-auto rounded-[2px]">
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
    <div className={cn('space-y-2 pointer-events-auto', className)}>
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
