import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { analyticsAllowed, buildEnvelope, drainQueue, enqueue, onQueue } from '@/lib/analytics';

/** Sends page views (and queued custom events) in small batches. Renders nothing. */
export function AnalyticsTracker() {
  const { pathname } = useLocation();
  const track = useMutation(api.analytics.track);
  const timer = useRef<number>();

  const flush = useRef(() => {});
  flush.current = () => {
    const events = drainQueue();
    if (events.length === 0) return;
    // The server accepts at most 10 events per call.
    for (let i = 0; i < events.length; i += 10) {
      track({ ...buildEnvelope(), events: events.slice(i, i + 10) }).catch(() => {
        /* analytics must never break the app */
      });
    }
  };

  useEffect(() => {
    if (!analyticsAllowed()) return;
    const off = onQueue(() => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => flush.current(), 800);
    });
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush.current();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      off();
      document.removeEventListener('visibilitychange', onHide);
      window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!analyticsAllowed() || pathname.startsWith('/admin')) return;
    enqueue({ type: 'pageview', path: pathname });
  }, [pathname]);

  return null;
}
