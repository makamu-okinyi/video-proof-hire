import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

interface RocketLoaderProps {
  /** Real progress, 0-100. Omit it (or pass `indeterminate`) when the amount of work is unknown. */
  progress?: number;
  label?: string;
  className?: string;
  /** No known progress: shows a neutral activity bar and never a made-up percentage. */
  indeterminate?: boolean;
}

const SLOW_AFTER_MS = 10_000;

/**
 * Donjo loading state. It only ever shows a percentage when the caller supplies a real one;
 * otherwise it shows honest, percentage-free activity, and after 10s it admits the wait is
 * longer than usual and offers a reload instead of spinning forever.
 */
export const RocketLoader = ({ progress, label = 'Loading', className = '', indeterminate }: RocketLoaderProps) => {
  const determinate = !indeterminate && typeof progress === 'number';
  const pct = determinate ? Math.min(100, Math.max(0, progress)) : 0;
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className={`flex flex-col items-center gap-6 ${className}`} role="status" aria-live="polite">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-border" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
        <Logo size="lg" />
      </div>

      <div className="w-full min-w-[240px] max-w-[320px] space-y-3 text-center">
        <p className="text-sm font-medium tracking-tight text-foreground">{label}</p>
        <div
          className="relative h-1 w-full overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={determinate ? Math.round(pct) : undefined}
        >
          {determinate ? (
            <div className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
          ) : (
            <div className="absolute inset-y-0 w-1/3 animate-[loader-slide_1.4s_ease-in-out_infinite] rounded-full bg-primary" />
          )}
        </div>
        {determinate && <p className="font-mono text-xs text-muted-foreground">{Math.round(pct)}%</p>}
        {slow && (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-muted-foreground">This is taking longer than usual. Check your connection.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" /> Reload
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
