import { useEffect, useState } from 'react';

const PATTERNS = ['/images/pattern-1.png', '/images/pattern-2.png', '/images/pattern-3.png', '/images/pattern-4.png'];

/**
 * Randomized Organic Background - Entire Site
 * Uses the 4 pattern images as-is, plus a 5th generated option inspired by their
 * marble/agate aesthetic (beige, off-white, fluid swirls).
 */
export function OrganicBackground() {
  const [variant, setVariant] = useState<'image' | 'generated'>(() => 'image');
  const [pattern, setPattern] = useState<string>(() => PATTERNS[0]);

  useEffect(() => {
    const choice = Math.random();
    if (choice < 0.2) {
      setVariant('generated');
    } else {
      setVariant('image');
      setPattern(PATTERNS[Math.floor(Math.random() * PATTERNS.length)]);
    }
  }, []);

  if (variant === 'image') {
    return (
      <div
        className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
        style={{
          backgroundImage: `url(${pattern})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />
    );
  }

  /* Generated: Marble/agate-inspired CSS background - beige, off-white, fluid organic shapes */
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base warm off-white */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #faf8f5 0%, #f5f0e8 50%, #ebe4da 100%)' }}
      />
      {/* Organic blob 1 - top right, marble swirl */}
      <div
        className="absolute -top-1/3 -right-1/4 w-[80vw] h-[80vw] rounded-full opacity-40 blur-3xl animate-float"
        style={{
          background: 'radial-gradient(ellipse at 70% 30%, #e8e0d5 0%, #d4c9bc 40%, transparent 70%)',
          animationDuration: '25s',
        }}
      />
      {/* Organic blob 2 - bottom left, cream */}
      <div
        className="absolute -bottom-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full opacity-50 blur-3xl animate-float"
        style={{
          background: 'radial-gradient(ellipse at 30% 70%, #f0ebe3 0%, #e2d9cc 50%, transparent 70%)',
          animationDuration: '20s',
          animationDelay: '-8s',
        }}
      />
      {/* Organic blob 3 - center, taupe accent */}
      <div
        className="absolute top-1/3 left-1/2 w-[60vw] h-[60vw] rounded-full opacity-25 blur-3xl animate-float"
        style={{
          background: 'radial-gradient(ellipse at center, #d8cfc4 0%, #c9bfb2 40%, transparent 65%)',
          animationDuration: '22s',
          animationDelay: '-3s',
        }}
      />
      {/* Organic blob 4 - light gold/bronze hint */}
      <div
        className="absolute top-1/2 right-1/3 w-[40vw] h-[40vw] rounded-full opacity-20 blur-2xl animate-float"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(212, 180, 140, 0.4) 0%, transparent 60%)',
          animationDuration: '18s',
          animationDelay: '-12s',
        }}
      />
      {/* Grain overlay - like pattern images */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
