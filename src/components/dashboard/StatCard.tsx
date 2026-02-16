import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  chart?: ReactNode;
}

export function StatCard({ title, value, change, changeLabel = 'last year', icon, chart }: StatCardProps) {
  const isPositive = change && change > 0;
  
  return (
    <div className="glass-panel p-6 rounded-3xl text-[#1e293b]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold text-charcoal font-mono" data-analytics>
            {value}
          </p>
        </div>
        {chart && (
          <div className="flex items-end gap-0.5 h-12">
            {chart}
          </div>
        )}
      </div>
      
      {change !== undefined && change !== 0 && (
        <div className="flex items-center gap-2">
          {icon}
          <div className={cn(
            "flex items-center gap-1 text-sm",
            isPositive ? "text-emerald-600" : "text-red-500"
          )}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="font-medium">
              {isPositive ? '+' : ''}{change.toFixed(2)}
            </span>
          </div>
          <span className="text-xs text-cool-grey">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}

export function MiniBarChart({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(...data, 1);
  
  return (
    <div className={cn("flex items-end gap-0.5", className)}>
      {data.map((value, index) => (
        <div
          key={index}
          className="w-1.5 bg-foreground/80 rounded-t-sm"
          style={{ height: `${(value / max) * 100}%`, minHeight: '4px' }}
        />
      ))}
    </div>
  );
}
