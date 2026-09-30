import { useEffect, useRef } from 'react';

export const ADMIN_IDLE_MINUTES = 30;
export const ADMIN_ACTIVITY_KEY = 'donjo-admin-last-activity';
export const ADMIN_NOTICE_KEY = 'donjo-admin-notice';

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart', 'wheel'] as const;
const WARN_BEFORE_MS = 60_000;

function readLast(): number | null {
  try {
    const raw = localStorage.getItem(ADMIN_ACTIVITY_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Record "the admin was active just now" (shared across tabs via localStorage). */
export function touchAdminActivity() {
  try {
    localStorage.setItem(ADMIN_ACTIVITY_KEY, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
}

export function clearAdminActivity() {
  try {
    localStorage.removeItem(ADMIN_ACTIVITY_KEY);
  } catch {
    /* ignore */
  }
}

interface Options {
  minutes?: number;
  enabled?: boolean;
  onWarn?: () => void;
  onIdle: () => void;
}

/**
 * Fires onIdle() once the user has been inactive for `minutes`. Activity is shared across
 * tabs through localStorage, and a stale timestamp (e.g. laptop asleep) expires immediately.
 */
export function useIdleSignOut({ minutes = ADMIN_IDLE_MINUTES, enabled = true, onWarn, onIdle }: Options) {
  const cbs = useRef({ onWarn, onIdle });
  cbs.current = { onWarn, onIdle };

  useEffect(() => {
    if (!enabled) return;
    const limit = minutes * 60_000;
    let warned = false;
    let fired = false;
    let lastWrite = 0;

    if (readLast() === null) touchAdminActivity();

    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite < 5_000) return; // throttle storage writes
      lastWrite = now;
      warned = false;
      touchAdminActivity();
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    const check = () => {
      if (fired) return;
      const last = readLast() ?? Date.now();
      const idleFor = Date.now() - last;
      if (idleFor >= limit) {
        fired = true;
        cbs.current.onIdle();
      } else if (!warned && idleFor >= limit - WARN_BEFORE_MS) {
        warned = true;
        cbs.current.onWarn?.();
      }
    };
    check();
    const timer = window.setInterval(check, 10_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [enabled, minutes]);
}
