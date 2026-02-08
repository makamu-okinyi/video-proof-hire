import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-card';

interface DarkStatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  chart?: React.ReactNode;
  className?: string;
}

export function DarkStatCard({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  icon,
  chart,
  className,
}: DarkStatCardProps) {
  const isPositive = change && change > 0;

  return (
    <GlassPanel className={cn("p-6 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          {title}
        </p>
        {icon && (
          <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-3xl font-bold text-white">{value}</p>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-sm",
              isPositive ? "text-green-400" : "text-red-400"
            )}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{isPositive ? '+' : ''}{(change * 100).toFixed(0)}%</span>
              <span className="text-white/40 ml-1">{changeLabel}</span>
            </div>
          )}
        </div>

        {chart && (
          <div className="flex-shrink-0">
            {chart}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

// Mini sparkline chart for cards
export function MiniSparkline({ 
  data, 
  className,
  color = 'primary' 
}: { 
  data: number[]; 
  className?: string;
  color?: 'primary' | 'green' | 'red';
}) {
  const max = Math.max(...data);
  const colorClass = {
    primary: 'bg-primary',
    green: 'bg-green-400',
    red: 'bg-red-400',
  }[color];

  return (
    <div className={cn("flex items-end gap-1 h-10", className)}>
      {data.map((value, i) => (
        <div
          key={i}
          className={cn(
            "w-2 rounded-sm transition-all",
            i === data.length - 1 ? colorClass : "bg-white/20"
          )}
          style={{ height: `${(value / max) * 100}%` }}
        />
      ))}
    </div>
  );
}
