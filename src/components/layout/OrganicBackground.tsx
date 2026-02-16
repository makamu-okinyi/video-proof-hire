import { useEffect, useState } from 'react';

const PATTERNS = ['/images/pattern-1.png', '/images/pattern-2.png', '/images/pattern-3.png', '/images/pattern-4.png'];

/**
 * Randomized Organic Background Component
 * Randomly selects one of 4 organic texture images on page load for full-screen background.
 */
export function OrganicBackground() {
  const [pattern, setPattern] = useState<string>(() => PATTERNS[0]);

  useEffect(() => {
    const idx = Math.floor(Math.random() * PATTERNS.length);
    setPattern(PATTERNS[idx]);
  }, []);

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
