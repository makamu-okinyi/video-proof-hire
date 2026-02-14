/** Proper display labels for venture stages (e.g. MVP not Mvp) */
const STAGE_LABELS: Record<string, string> = {
  idea: 'Idea',
  prototype: 'Prototype',
  mvp: 'MVP',
  growth: 'Growth',
  scale: 'Scale',
};

export function formatStage(stage: string | null | undefined): string {
  if (!stage) return '';
  const key = stage.toLowerCase();
  return STAGE_LABELS[key] ?? stage.charAt(0).toUpperCase() + stage.slice(1);
}
