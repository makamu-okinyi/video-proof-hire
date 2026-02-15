import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface GolfBallLoaderProps {
  progress?: number;
  label?: string;
  className?: string;
  /** If true, animates 0-90 in a loop for indeterminate loading */
  indeterminate?: boolean;
}

export const GolfBallLoader = ({ progress = 0, label = 'Loading', className = '', indeterminate }: GolfBallLoaderProps) => {
  const [loopProgress, setLoopProgress] = useState(0);
  useEffect(() => {
    if (!indeterminate) return;
    const id = setInterval(() => {
      setLoopProgress((p) => (p >= 90 ? 0 : p + 2));
    }, 80);
    return () => clearInterval(id);
  }, [indeterminate]);
  const pct = indeterminate ? loopProgress : Math.min(100, Math.max(0, progress));

  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      <div className="relative w-full max-w-[420px] min-w-[320px] px-4">
        {/* Percentage indicator */}
        <div
          className="absolute -top-8 left-0 flex flex-col items-center transition-all duration-300"
          style={{ left: `calc(${pct}% - 24px)` }}
        >
          <span className="font-mono text-sm font-medium text-charcoal dark:text-charcoal">
            {Math.round(pct)}%
          </span>
          <span className="h-0 w-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-charcoal/80 dark:border-t-charcoal" />
        </div>

        {/* Grass track */}
        <div className="relative h-14 w-full overflow-hidden rounded-[2px]">
          <div
            className="absolute inset-0 rounded-[2px]"
            style={{
              background: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(34,197,94,0.15) 2px,
                rgba(34,197,94,0.15) 4px
              )`,
              backgroundColor: 'hsl(142 71% 35%)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1)',
            }}
          />
          {/* Golf hole at end */}
          <div
            className="absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, hsl(25 50% 25%), hsl(25 60% 15%))',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
            }}
          />
        </div>

        {/* Golf ball */}
        <motion.div
          className="absolute top-1/2 h-10 w-10 -translate-y-1/2 -translate-x-1/2"
          initial={{ left: '2%' }}
          animate={{ left: `calc(${pct}% - 20px)` }}
          transition={{ type: 'tween', duration: 0.3 }}
        >
          <div
            className="h-full w-full rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #fff, #e5e7eb)',
              boxShadow:
                '2px 2px 4px rgba(255,255,255,0.8), -1px -1px 2px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.2)',
            }}
          >
            {/* Dimples */}
            <svg viewBox="0 0 28 28" className="absolute inset-0 h-full w-full rounded-full opacity-30">
              {[
                [6, 6], [14, 6], [22, 6],
                [10, 12], [18, 12],
                [6, 18], [14, 18], [22, 18],
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="1.5" fill="rgba(0,0,0,0.2)" />
              ))}
            </svg>
          </div>
        </motion.div>
      </div>
      <span className="font-mono text-base font-medium text-charcoal">{label}</span>
    </div>
  );
};
