import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface RocketLoaderProps {
  progress?: number;
  label?: string;
  className?: string;
  /** If true, animates 0-90 in a loop for indeterminate loading */
  indeterminate?: boolean;
}

/** 3D Donjo Rocket - sleek skeuomorphic rocket icon */
const RocketSVG = () => (
  <svg viewBox="0 0 48 48" className="h-full w-full">
    <defs>
      <linearGradient id="rocket-body" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="50%" stopColor="#ea580c" />
        <stop offset="100%" stopColor="#c2410c" />
      </linearGradient>
      <linearGradient id="rocket-nose" x1="50%" y1="100%" x2="50%" y2="0%">
        <stop offset="0%" stopColor="#fb923c" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
      <filter id="rocket-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#rocket-shadow)" transform="rotate(-45 24 24)">
      {/* Nose cone */}
      <path d="M24 8 L32 24 L24 40 L16 24 Z" fill="url(#rocket-nose)" />
      {/* Body */}
      <rect x="18" y="20" width="12" height="18" rx="2" fill="url(#rocket-body)" />
      {/* Window */}
      <circle cx="24" cy="28" r="3" fill="#0ea5e9" opacity="0.9" />
      <circle cx="24" cy="28" r="1.5" fill="#fff" opacity="0.6" />
      {/* Fins */}
      <path d="M18 38 L14 48 L18 48 Z" fill="#c2410c" />
      <path d="M30 38 L34 48 L30 48 Z" fill="#c2410c" />
      <path d="M24 38 L24 48 L28 46 L24 38 L20 46 Z" fill="#a3a3a3" />
      {/* Flame */}
      <path d="M22 44 Q24 52 26 44" stroke="#fbbf24" strokeWidth="2" fill="none" opacity="0.9" />
    </g>
  </svg>
);

export const RocketLoader = ({ progress = 0, label = 'Loading', className = '', indeterminate }: RocketLoaderProps) => {
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
        {/* Percentage - JetBrains Mono */}
        <motion.div
          className="absolute -top-9 left-0 flex flex-col items-center z-20"
          animate={{ left: `calc(${pct}% - 20px)` }}
          transition={{ type: 'tween', duration: 0.25 }}
        >
          <span className="text-sm font-semibold text-[#3d3635] drop-shadow-sm" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
            {Math.round(pct)}%
          </span>
          <span className="border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-[#3d3635]/90 mt-[1px]" />
        </motion.div>

        {/* Grass track - lush textured, 2px radius */}
        <div className="relative h-16 w-full overflow-visible">
          <div
            className="absolute inset-0 overflow-hidden rounded-[2px]"
            style={{
              boxShadow: '0 4px 8px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            <div
              className="absolute inset-0 rounded-[2px]"
              style={{
                background: 'linear-gradient(180deg, hsl(98,65%,55%) 0%, hsl(120,45%,42%) 30%, hsl(130,50%,38%) 60%, hsl(135,55%,32%) 100%)',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.2)',
              }}
            />
            <div
              className="absolute inset-0 rounded-[2px] opacity-75"
              style={{
                backgroundImage: 'repeating-linear-gradient(95deg, transparent 0 1px, rgba(255,255,255,0.08) 1px 2px), repeating-linear-gradient(85deg, transparent 0 1px, rgba(0,0,0,0.06) 1px 2px)',
              }}
            />
            <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-[2px] pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)' }} />
            <div className="absolute bottom-0 left-0 right-0 h-3 rounded-b-[2px] overflow-hidden">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="absolute rounded-full bg-[#5c4033] opacity-60" style={{ width: `${4 + (i % 3)}px`, height: `${2 + (i % 2)}px`, left: `${(i * 4.5) % 100}%`, bottom: `${(i % 4) * 2}px` }} />
              ))}
            </div>
            {/* Launch pad / endpoint */}
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[2px]"
              style={{
                width: 24,
                height: 32,
                background: 'linear-gradient(180deg, #64748b, #475569)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.2)',
              }}
            />
          </div>
        </div>

        {/* Rocket - glides along track */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 pointer-events-auto"
          animate={{ left: `calc(${pct}% - 20px)` }}
          transition={{ type: 'tween', duration: 0.25 }}
        >
          <RocketSVG />
        </motion.div>
      </div>

      <span className="font-mono text-[15px] font-medium text-[#3d3635] tracking-tight" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
        {label}
      </span>
    </div>
  );
};
