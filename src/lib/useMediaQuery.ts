import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query and return whether it currently matches.
 * Safe to use during SSR (returns false), updates on viewport changes.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(query);
    const handler = () => setMatches(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export const useIsNarrow = () => useMediaQuery('(max-width: 900px)');
export const useIsMobile = () => useMediaQuery('(max-width: 600px)');
