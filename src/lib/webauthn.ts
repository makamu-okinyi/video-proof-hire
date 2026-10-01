/**
 * Browser-side passkey (WebAuthn) helpers. The actual ceremonies run through
 * @simplewebauthn/browser; verification happens on the Convex backend.
 */
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';

/** True when this browser can create / use passkeys at all. */
export function isPasskeySupported(): boolean {
  try {
    return typeof window !== 'undefined' && browserSupportsWebAuthn();
  } catch {
    return false;
  }
}

/** A friendly default name for a new passkey, e.g. "Chrome on Windows". */
export function defaultDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'My passkey';
  const ua = navigator.userAgent;
  const os = /Windows/i.test(ua)
    ? 'Windows'
    : /iPhone|iPad|iPod/i.test(ua)
      ? 'iOS'
      : /Android/i.test(ua)
        ? 'Android'
        : /Mac OS X|Macintosh/i.test(ua)
          ? 'Mac'
          : /Linux|CrOS/i.test(ua)
            ? 'Linux'
            : null;
  const browser = /Edg\//i.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/i.test(ua)
      ? 'Opera'
      : /Firefox\//i.test(ua)
        ? 'Firefox'
        : /Chrome\//i.test(ua)
          ? 'Chrome'
          : /Safari\//i.test(ua)
            ? 'Safari'
            : 'Browser';
  return os ? `${browser} on ${os}` : browser;
}

export type PasskeyFlow = 'register' | 'signin';

/** Turn a WebAuthn / network failure into a message safe and friendly to show users. */
export function describePasskeyError(err: unknown, flow: PasskeyFlow): string {
  const name = (err as { name?: string })?.name ?? '';
  const data = (err as { data?: unknown })?.data;
  const message = (err instanceof Error ? err.message : '') + (typeof data === 'string' ? ` ${data}` : '');

  if (/PASSKEYS_NOT_CONFIGURED/.test(message)) {
    return 'Passkeys are temporarily unavailable. Please use your password instead.';
  }
  if (name === 'NotAllowedError' || name === 'AbortError' || /cancel|timed out|not allowed/i.test(message)) {
    return flow === 'register'
      ? 'Passkey setup was cancelled. You can try again whenever you are ready.'
      : 'Passkey sign-in was cancelled or timed out. Try again, or use your password.';
  }
  if (name === 'InvalidStateError') {
    return 'This device already has a passkey saved for your account.';
  }
  if (name === 'NotSupportedError' || name === 'SecurityError') {
    return 'This browser or device cannot use passkeys here. Please use your password instead.';
  }
  if (/network|fetch|failed to fetch/i.test(message)) {
    return 'Network error. Please check your connection and try again.';
  }
  return flow === 'register'
    ? 'We could not add your passkey. Please try again.'
    : 'Passkey sign-in did not work. Try again, or use your password.';
}
