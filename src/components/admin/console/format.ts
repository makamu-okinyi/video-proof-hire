/** Small formatting helpers shared by the console pages. */

export function formatNumber(n: number | null | undefined, capped = false): string {
  if (n === null || n === undefined) return '-';
  return `${n.toLocaleString('en-GB')}${capped ? '+' : ''}`;
}

export function formatDate(ms: number | null | undefined): string {
  if (!ms) return '-';
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(ms: number | null | undefined): string {
  if (!ms) return '-';
  return new Date(ms).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(ms: number | null | undefined, now = Date.now()): string {
  if (!ms) return 'never';
  const diff = Math.max(0, now - ms);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(ms);
}

/** "3.5 h", "2.1 days" from a number of hours. */
export function formatHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return '-';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} days`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let n = bytes / 1024;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`;
}

export function percent(part: number, total: number): string {
  if (!total) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    talent: 'Applicant', employer: 'Employer', founder: 'Founder', investor: 'Investor',
    judge: 'Judge', admin: 'Admin', unassigned: 'Unassigned',
  };
  return map[role] ?? role;
}
