'use client';

import { useEffect } from 'react';
import { useReducedMotion } from '@/game/ui/use-reduced-motion';

const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * Entrance animation through the Web Animations API.
 *
 * The game deliberately doesn't use the `motion` library the portfolio uses: sharing
 * it with this lazy route made the bundler split it differently for the home page,
 * adding ~4.6 KB gzip to `/`. A few native animations cover everything the game needs.
 */
export function useAppear(
  ref: React.RefObject<HTMLElement | null>,
  from: Keyframe = { opacity: 0, transform: 'translateY(10px)' },
  duration = 180
) {
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (reduced || !el?.animate) return;
    el.animate([from, { opacity: 1, transform: 'none' }], { duration, easing: EASE_OUT });
    // Only on mount: the keyframes are a constant per call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** A short horizontal shake (the boss taking a hit). */
export function shake(el: HTMLElement | null, reduced: boolean) {
  if (reduced || !el?.animate) return;
  el.animate(
    [
      { transform: 'none' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(4px)' },
      { transform: 'none' },
    ],
    { duration: 350, easing: 'ease-out' }
  );
}
