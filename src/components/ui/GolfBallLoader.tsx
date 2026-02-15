import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface GolfBallLoaderProps {
  progress?: number;
  label?: string;
  className?: string;
  /** If true, animates 0-90 in a loop for indeterminate loading */
  indeterminate?: boolean;
}

/** 3D SVG golf ball with dimples - realistic skeuomorphic target */
const GolfBallSVG = () => (
  <svg viewBox="0 0 48 48" className="h-full w-full">
    <defs>
      <radialGradient id="ball-shade" cx="35%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="30%" stopColor="#f5f5f5" />
        <stop offset="60%" stopColor="#e0e0e0" />
        <stop offset="100%" stopColor="#c0c0c0" />
      </radialGradient>
      <filter id="ball-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
      </filter>
      <filter id="specular">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#ball-shadow)">
      <circle cx="24" cy="24" r="22" fill="url(#ball-shade)" />
      {/* Dimples - icosahedral pattern */}
      {[
        [12, 12], [24, 10], [36, 12],
        [8, 20], [18, 18], [30, 18], [40, 20],
        [12, 24], [24, 24], [36, 24],
        [8, 28], [18, 30], [30, 30], [40, 28],
        [12, 36], [24, 38], [36, 36],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2" fill="rgba(0,0,0,0.15)" />
      ))}
      {/* Specular highlight */}
      <circle cx="16" cy="14" r="4" fill="rgba(255,255,255,0.8)" opacity="0.9" />
    </g>
  </svg>
);

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

  // Roll rotation: ball rotates as it travels (360° per full track)
  const rollDegrees = (pct / 100) * 360;

  return (
    <div className={`flex flex-col items-center gap-7 ${className}`}>
      <div className="relative w-full max-w-[420px] min-w-[320px] px-4">
        {/* Percentage - JetBrains Mono for technical precision */}
        <motion.div
          className="absolute -top-9 left-0 flex flex-col items-center z-20 font-mono"
          animate={{ left: `calc(${pct}% - 20px)` }}
          transition={{ type: 'tween', duration: 0.25 }}
        >
          <span className="text-sm font-semibold text-[#3d3635] drop-shadow-sm" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
            {Math.round(pct)}%
          </span>
          <span className="border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-[#3d3635]/90 mt-[1px]" />
        </motion.div>

        {/* Grass track - lush textured, industrial 2px radius */}
        <div className="relative h-16 w-full overflow-visible">
          <div
            className="absolute inset-0 overflow-hidden rounded-[2px]"
            style={{
              boxShadow: '0 4px 8px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            {/* Base grass - lush multi-tone */}
            <div
              className="absolute inset-0 rounded-[2px]"
              style={{
                background: 'linear-gradient(180deg, hsl(98,65%,55%) 0%, hsl(120,45%,42%) 30%, hsl(130,50%,38%) 60%, hsl(135,55%,32%) 100%)',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.2)',
              }}
            />
            {/* Grass blade texture */}
            <div
              className="absolute inset-0 rounded-[2px] opacity-75"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(95deg, transparent 0 1px, rgba(255,255,255,0.08) 1px 2px),
                  repeating-linear-gradient(85deg, transparent 0 1px, rgba(0,0,0,0.06) 1px 2px)
                `,
              }}
            />
            {/* Top highlight */}
            <div
              className="absolute top-0 left-0 right-0 h-1/3 rounded-t-[2px] pointer-events-none"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)' }}
            />
            {/* Dirt speckles at base */}
            <div className="absolute bottom-0 left-0 right-0 h-3 rounded-b-[2px] overflow-hidden">
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
            {/* Golf hole - right end */}
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 28,
                height: 28,
                boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.6), inset 0 1px 2px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.2)',
                background: 'radial-gradient(ellipse 60% 70% at 35% 40%, hsl(25,45%,22%), hsl(25,50%,14%) 50%, hsl(25,55%,10%) 100%)',
                border: '2px solid hsl(25,40%,18%)',
              }}
            />
          </div>
        </div>

        {/* Golf ball - 3D SVG with roll physics */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10"
          animate={{
            left: `calc(${pct}% - 20px)`,
            rotate: rollDegrees,
          }}
          transition={{ type: 'tween', duration: 0.25 }}
        >
          <GolfBallSVG />
        </motion.div>
      </div>

      {/* Loading label - JetBrains Mono */}
      <span className="font-mono text-[15px] font-medium text-[#3d3635] tracking-tight" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
        {label}
      </span>
    </div>
  );
};
