import { useEffect } from 'react';

const SUFFIX = 'Donjo';

/**
 * Sets a unique document title for the page ("Jobs | Donjo") and restores the previous
 * title on unmount. Pass the page name only; the brand suffix is added here.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} | ${SUFFIX}` : SUFFIX;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
