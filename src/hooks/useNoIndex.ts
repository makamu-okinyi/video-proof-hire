import { useEffect } from 'react';

/** Adds <meta name="robots" content="noindex, nofollow"> while the calling page is mounted. */
export function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow, noarchive';
    meta.setAttribute('data-admin-noindex', 'true');
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);
}
