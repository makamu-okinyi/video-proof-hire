/**
 * Donjo High-Res Background Stack
 * Three-layer stack to fix quality loss on Chromebook.
 * Layer 1 (Top): Slate-950 gradient overlay
 * Layer 2 (Middle): Geospatial map
 * Layer 3 (Bottom): Industrial texture
 */
export function OrganicBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none donjo-bg-stack"
      style={{
        backgroundImage: `
          linear-gradient(to bottom, rgba(2, 6, 23, 0.8), rgba(2, 6, 23, 0.6)),
          url(/images/geospatial-map.png),
          url(/images/industrial-texture.png)
        `,
        backgroundSize: 'auto, cover, cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundBlendMode: 'multiply, overlay, normal',
        backgroundAttachment: 'fixed',
        imageRendering: '-webkit-optimize-contrast',
      }}
    />
  );
}
