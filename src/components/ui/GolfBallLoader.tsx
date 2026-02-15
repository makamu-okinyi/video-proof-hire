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
    <div className={`flex flex-col items-center gap-7 ${className}`}>
      <div className="relative w-full max-w-[420px] min-w-[320px] px-4">
        {/* Percentage indicator with caret - above the ball */}
        <div
          className="absolute -top-9 left-0 flex flex-col items-center transition-all duration-300 z-20"
          style={{ left: `calc(${pct}% - 20px)` }}
        >
          <span className="font-mono text-sm font-semibold text-[#3d3635] drop-shadow-sm">
            {Math.round(pct)}%
          </span>
          <span
            className="border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-[#3d3635]/90"
            style={{ marginTop: '1px' }}
          />
        </div>

        {/* Grass track - skeuomorphic, elevated 3D strip */}
        <div className="relative h-16 w-full overflow-visible">
          <div
            className="absolute inset-0 rounded-[8px] overflow-hidden"
            style={{
              boxShadow: `
                0 4px 8px rgba(0,0,0,0.15),
                0 2px 4px rgba(0,0,0,0.1),
                inset 0 1px 0 rgba(255,255,255,0.3)
              `,
            }}
          >
            {/* Base grass - multi-tone greens, lush gradient */}
            <div
              className="absolute inset-0 rounded-[8px]"
              style={{
                background: `
                  linear-gradient(180deg,
                    hsl(98, 65%, 55%) 0%,
                    hsl(120, 45%, 42%) 30%,
                    hsl(130, 50%, 38%) 60%,
                    hsl(135, 55%, 32%) 100%
                  )
                `,
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.2)',
              }}
            />

            {/* Grass blade texture - fine striped overlay */}
            <div
              className="absolute inset-0 rounded-[8px] opacity-70"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    95deg,
                    transparent 0px,
                    transparent 1px,
                    rgba(255,255,255,0.08) 1px,
                    rgba(255,255,255,0.08) 2px
                  ),
                  repeating-linear-gradient(
                    85deg,
                    transparent 0px,
                    transparent 1px,
                    rgba(0,0,0,0.06) 1px,
                    rgba(0,0,0,0.06) 2px
                  )
                `,
              }}
            />

            {/* Fuzzy top highlight - grass catching light */}
            <div
              className="absolute top-0 left-0 right-0 rounded-t-[8px] pointer-events-none"
              style={{
                height: '33%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
              }}
            />

            {/* Dirt speckles at base - scattered brown particles */}
            <div className="absolute bottom-0 left-0 right-0 h-3 rounded-b-[8px] overflow-hidden">
              {[...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-[#5c4033] opacity-60"
                  style={{
                    width: `${4 + (i % 3)}px`,
                    height: `${2 + (i % 2)}px`,
                    left: `${(i * 4.5) % 100}%`,
                    bottom: `${(i % 4) * 2}px`,
                  }}
                />
              ))}
            </div>

            {/* Golf hole - right end, dark brown depression with rim */}
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 28,
                height: 28,
                boxShadow: `
                  inset 0 3px 8px rgba(0,0,0,0.6),
                  inset 0 1px 2px rgba(0,0,0,0.4),
                  0 1px 2px rgba(0,0,0,0.2)
                `,
                background: `
                  radial-gradient(
                    ellipse 60% 70% at 35% 40%,
                    hsl(25, 45%, 22%),
                    hsl(25, 50%, 14%) 50%,
                    hsl(25, 55%, 10%) 100%
                  )
                `,
                border: '2px solid hsl(25, 40%, 18%)',
              }}
            />
          </div>
        </div>

        {/* Golf ball - 3D, dimpled, settled into grass */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
          animate={{ left: `calc(${pct}% - 20px)` }}
          transition={{ type: 'tween', duration: 0.25 }}
        >
          <div
            className="relative w-10 h-10 rounded-full"
            style={{
              boxShadow: `
                2px 2px 6px rgba(255,255,255,0.9),
                -1px -1px 3px rgba(0,0,0,0.08),
                0 4px 12px rgba(0,0,0,0.25),
                0 2px 4px rgba(0,0,0,0.15)
              `,
              background: `
                radial-gradient(
                  circle at 35% 35%,
                  #ffffff,
                  #f5f5f5 25%,
                  #e8e8e8 50%,
                  #d4d4d4 100%
                )
              `,
            }}
          >
            {/* Dimples - realistic pattern */}
            <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full rounded-full opacity-[0.35]">
              {[
                [8, 8], [20, 8], [32, 8],
                [4, 15], [14, 15], [26, 15], [36, 15],
                [8, 22], [20, 22], [32, 22],
                [4, 29], [14, 29], [26, 29], [36, 29],
                [8, 36], [20, 36], [32, 36],
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="1.8" fill="rgba(0,0,0,0.25)" />
              ))}
            </svg>
            {/* Specular highlight */}
            <div
              className="absolute top-1 left-2 w-2 h-2 rounded-full opacity-80"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, transparent 70%)',
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Loading label - centered below */}
      <span className="font-medium text-[15px] text-[#3d3635] tracking-tight">{label}</span>
    </div>
  );
};
