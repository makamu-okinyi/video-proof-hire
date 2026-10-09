import { ConvexError } from 'convex/values';

/** Friendly message for a failed sign-in. Never exposes Convex internals or request ids. */
export function describeSignInError(err: unknown, flow: 'signIn' | 'signUp'): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  if (/InvalidAccountId/i.test(raw)) {
    return "We couldn't find an account with that email. Check the spelling, or sign up to create one.";
  }
  if (/InvalidSecret/i.test(raw) && flow === 'signUp') {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (/InvalidSecret/i.test(raw)) {
    return 'That email and password do not match. Check them and try again, or reset your password.';
  }
  if (/TooManyFailedAttempts|rate limit|too many/i.test(raw)) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }
  if (/already exists|AccountAlreadyExists|already registered/i.test(raw)) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (/network|failed to fetch|offline/i.test(raw)) {
    return 'Network error. Please check your connection and try again.';
  }
  if (/suspended/i.test(raw)) {
    return 'This account has been suspended. Contact the Donjo team if you think this is a mistake.';
  }
  // Production Convex redacts error text to "Server Error"; for sign-in that nearly always
  // means bad credentials.
  if (/Server Error/i.test(raw) && flow === 'signIn') {
    return "We couldn't sign you in. Check your email and password, or sign up if you are new.";
  }
  return flow === 'signIn'
    ? 'Sign-in did not work. Please try again.'
    : "We couldn't create your account. Please check your details and try again.";
}

/** Friendly message for any other backend failure. */
export function describeError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof ConvexError && typeof err.data === 'string') return err.data;
  const raw = err instanceof Error ? err.message : '';
  if (/network|failed to fetch/i.test(raw)) return 'Network error. Please check your connection and try again.';
  return fallback;
}
