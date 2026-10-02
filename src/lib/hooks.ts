'use client';

import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true afterwards — without an effect + setState round trip. */
export function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

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

export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** True once the window has scrolled past `offset` pixels. */
export function useScrolledPast(offset: number) {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener('scroll', onChange, { passive: true });
      return () => window.removeEventListener('scroll', onChange);
    },
    () => window.scrollY > offset,
    () => false
  );
}

/** The URL fragment without `#`; '' during SSR. Updates on `hashchange`. */
export function useLocationHash() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener('hashchange', onChange);
      return () => window.removeEventListener('hashchange', onChange);
    },
    () => decodeURIComponent(window.location.hash.slice(1)),
    () => ''
  );
}

/** Replace the fragment without scrolling or adding a history entry, and notify useLocationHash. */
export function replaceLocationHash(hash: string) {
  window.history.replaceState(window.history.state, '', `#${encodeURIComponent(hash)}`);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}
