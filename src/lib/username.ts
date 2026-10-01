/** Usernames become the applicant's dashboard URL (/<username>), so they must be URL-safe and not collide with app routes. */
export const USERNAME_RE = /^[a-z0-9][a-z0-9_.-]{2,29}$/;

export const RESERVED_USERNAMES = new Set([
  'admin', 'auth', 'feed', 'discover', 'jobs', 'challenges', 'ventures', 'venture', 'apply', 'founder', 'employer', 'profile', 'settings',
  'messages', 'notifications', 'create', 'watch', 'user', 'users', 'privacy', 'terms', 'cookies', 'forgot-password', 'api',
  'login', 'signup', 'support', 'help', 'about', 'contact', 'donjo', 'dashboard', 'account', 'assets', 'static',
]);

export function normaliseUsername(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

/** Returns an error message, or null when the username is acceptable. */
export function validateUsername(raw: string): string | null {
  const u = normaliseUsername(raw);
  if (!u) return 'Choose a username.';
  if (u.length < 3) return 'Username must be at least 3 characters.';
  if (u.length > 30) return 'Username must be 30 characters or fewer.';
  if (!USERNAME_RE.test(u)) return 'Use only letters, numbers, dots, dashes and underscores.';
  if (RESERVED_USERNAMES.has(u)) return 'That username is reserved. Please choose another.';
  return null;
}

/** The applicant's dashboard path: /<username>, or /founder for legacy accounts without a URL-safe username. */
export function applicantDashboardPath(username?: string | null): string {
  const u = username ? normaliseUsername(username) : '';
  return u && USERNAME_RE.test(u) && !RESERVED_USERNAMES.has(u) ? `/${u}` : '/founder';
}
