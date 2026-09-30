/**
 * First-party, privacy-friendly analytics (client side). Design rules:
 *  - Honour Do Not Track and Global Privacy Control: nothing is sent.
 *  - No cookies, no IP addresses, no fingerprinting. A random visitor id lives in
 *    localStorage; a session id lives in sessionStorage and rolls over after 30 idle minutes.
 *  - Bots / headless browsers are skipped. The admin console is never tracked.
 *  - Only coarse device info is sent: device class, browser/OS family, timezone, language.
 */

const VISITOR_KEY = 'donjo_vid';
const SESSION_KEY = 'donjo_sid';
const SESSION_TS_KEY = 'donjo_sid_ts';
const SESSION_UTM_KEY = 'donjo_utm';
const SESSION_IDLE_MS = 30 * 60 * 1000;
const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|prerender|puppeteer|playwright|phantom|selenium|facebookexternalhit|preview|monitor|pingdom/i;

export interface AnalyticsEnvelope {
  visitorId: string;
  sessionId: string;
  isNewVisitor: boolean;
  device: string;
  browser: string;
  os: string;
  timezone?: string;
  language?: string;
  referrerHost?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface QueuedEvent {
  type: 'pageview' | 'event';
  name?: string;
  path: string;
}

function safeGet(store: Storage, key: string): string | null {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(store: Storage, key: string, value: string) {
  try {
    store.setItem(key, value);
  } catch {
    /* storage blocked */
  }
}

export function analyticsAllowed(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  const win = window as Window & { doNotTrack?: string };
  if (nav.doNotTrack === '1' || win.doNotTrack === '1' || nav.msDoNotTrack === '1' || nav.globalPrivacyControl) return false;
  if (nav.webdriver || BOT_RE.test(nav.userAgent)) return false;
  return true;
}

function randomId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function parseBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/SamsungBrowser/.test(ua)) return 'Samsung Internet';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Other';
}
function parseOs(ua: string): string {
  if (/Windows/.test(ua)) return 'Windows';
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Mac OS X|Macintosh/.test(ua)) return 'macOS';
  if (/CrOS/.test(ua)) return 'ChromeOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Other';
}
function parseDevice(ua: string): string {
  if (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) return 'tablet';
  if (/Mobi|iPhone|Android/.test(ua)) return 'mobile';
  return window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
}

/** Build the per-visit envelope (creating/rolling the visitor and session ids as needed). */
export function buildEnvelope(): AnalyticsEnvelope {
  const now = Date.now();
  let visitorId = safeGet(localStorage, VISITOR_KEY);
  const isNewVisitor = !visitorId;
  if (!visitorId) {
    visitorId = randomId();
    safeSet(localStorage, VISITOR_KEY, visitorId);
  }

  let sessionId = safeGet(sessionStorage, SESSION_KEY);
  const lastTs = Number(safeGet(sessionStorage, SESSION_TS_KEY) ?? 0);
  const newSession = !sessionId || now - lastTs > SESSION_IDLE_MS;
  if (newSession) {
    sessionId = randomId();
    safeSet(sessionStorage, SESSION_KEY, sessionId);
    // Capture campaign + referrer once per session.
    const params = new URLSearchParams(window.location.search);
    const attr = {
      utmSource: params.get('utm_source')?.slice(0, 60) || undefined,
      utmMedium: params.get('utm_medium')?.slice(0, 60) || undefined,
      utmCampaign: params.get('utm_campaign')?.slice(0, 80) || undefined,
      referrerHost: undefined as string | undefined,
    };
    try {
      if (document.referrer) {
        const host = new URL(document.referrer).hostname;
        if (host && host !== window.location.hostname) attr.referrerHost = host;
      }
    } catch {
      /* ignore bad referrer */
    }
    safeSet(sessionStorage, SESSION_UTM_KEY, JSON.stringify(attr));
  }
  safeSet(sessionStorage, SESSION_TS_KEY, String(now));

  let attribution: Partial<AnalyticsEnvelope> = {};
  try {
    attribution = JSON.parse(safeGet(sessionStorage, SESSION_UTM_KEY) ?? '{}');
  } catch {
    /* ignore */
  }

  const ua = navigator.userAgent;
  return {
    visitorId,
    sessionId: sessionId!,
    isNewVisitor: isNewVisitor && newSession,
    device: parseDevice(ua),
    browser: parseBrowser(ua),
    os: parseOs(ua),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
    language: navigator.language,
    ...attribution,
  };
}

// Events queued from anywhere in the app; flushed by <AnalyticsTracker />.
const listeners = new Set<() => void>();
const queue: QueuedEvent[] = [];

export function enqueue(e: QueuedEvent) {
  queue.push(e);
  listeners.forEach((l) => l());
}
export function trackEvent(name: string) {
  if (!analyticsAllowed()) return;
  enqueue({ type: 'event', name, path: window.location.pathname });
}
export function drainQueue(): QueuedEvent[] {
  return queue.splice(0, queue.length);
}
export function onQueue(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
