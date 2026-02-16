/**
 * Donjo Premium Minimalist - Global Background Engine
 * Base: Slate-50 (#F8FAFC)
 * Topographic watermark at 0.04 opacity (repeating) - signals Geospatial authority
 */
export function OrganicBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none donjo-bg-stack"
      style={{ backgroundColor: '#F8FAFC' }}
    >
      {/* Topographic watermark overlay at 0.04 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(/images/topographic-watermark.png)`,
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center',
          backgroundSize: 'auto',
          opacity: 0.04,
          mixBlendMode: 'multiply',
        }}
      />
    </div>
  );
}
