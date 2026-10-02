'use client';

import { useMediaQuery } from '@/game/ui/use-media-query';
import { useGame } from '@/game/store/game-store';

/** The in-game setting if the player chose one, otherwise the OS preference. */
export function useReducedMotion() {
  const os = useMediaQuery('(prefers-reduced-motion: reduce)');
  const pref = useGame((s) => s.settings.reducedMotion);
  return pref ?? os;
}
