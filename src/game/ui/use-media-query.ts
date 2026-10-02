'use client';

import { useSyncExternalStore } from 'react';

/**
 * The game's own copy of a media-query hook. Sharing the portfolio's lib/hooks
 * made the bundler split it into a separate chunk that the home page then had to
 * download too — so the game keeps this one to itself.
 */
export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue
  );
}
