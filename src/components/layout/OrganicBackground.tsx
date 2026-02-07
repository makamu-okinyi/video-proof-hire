import * as React from "react";

/**
 * Organic Abstract Background Component
 * Creates fluid, flowing shapes with orange/earth tones using pure CSS
 */
export function OrganicBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary" />
      
      {/* Organic blob 1 - Top right warm orange */}
      <div 
        className="absolute -top-1/4 -right-1/4 w-[60vw] h-[60vw] rounded-full opacity-20 blur-3xl animate-float"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(24, 80%, 65%) 0%, transparent 70%)',
          animationDuration: '20s',
        }}
      />
      
      {/* Organic blob 2 - Bottom left clay/beige */}
      <div 
        className="absolute -bottom-1/3 -left-1/4 w-[50vw] h-[50vw] rounded-full opacity-25 blur-3xl animate-float"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(30, 50%, 55%) 0%, transparent 70%)',
          animationDuration: '25s',
          animationDelay: '-5s',
        }}
      />
      
      {/* Organic blob 3 - Center subtle dark accent */}
      <div 
        className="absolute top-1/3 left-1/3 w-[40vw] h-[40vw] rounded-full opacity-10 blur-3xl animate-float"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(30, 15%, 20%) 0%, transparent 60%)',
          animationDuration: '18s',
          animationDelay: '-10s',
        }}
      />
      
      {/* Organic blob 4 - Floating warm accent */}
      <div 
        className="absolute top-1/2 right-1/4 w-[30vw] h-[30vw] rounded-full opacity-15 blur-3xl animate-float"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(18, 70%, 60%) 0%, transparent 65%)',
          animationDuration: '22s',
          animationDelay: '-3s',
        }}
      />

      {/* Subtle grain texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
