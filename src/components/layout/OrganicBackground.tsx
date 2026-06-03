/**
 * Retired in the design unification (Phase 4.0): the glassmorphism slate base +
 * topographic watermark are gone. The warm-gray neomorphic base is now painted by
 * `body { @apply bg-background }` (src/index.css). Kept as a no-op so call-sites
 * (App.tsx) don't need to change; a subtle texture can be reintroduced later if wanted.
 */
export function OrganicBackground() {
  return null;
}
