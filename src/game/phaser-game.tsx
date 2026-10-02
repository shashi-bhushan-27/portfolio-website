'use client';

import { useEffect, useRef } from 'react';
import type { GameBridge, GameHandle } from '@/game/engine/types';

type Props = GameBridge & {
  /** The engine chunk (Phaser + scenes) has downloaded. */
  onEngineLoaded: () => void;
  onError: (error: unknown) => void;
  entered: boolean;
  className?: string;
};

/** Owns the Phaser instance: imports the engine on mount, destroys it on unmount. */
export function PhaserGame({ entered, className, ...events }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<GameHandle | null>(null);
  // Scenes call the latest callbacks without the engine restarting on every render.
  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  });

  useEffect(() => {
    let cancelled = false;
    const bridge: GameBridge = {
      onRendererReady: (renderer) => eventsRef.current.onRendererReady(renderer),
      onAssetProgress: (progress) => eventsRef.current.onAssetProgress(progress),
      onReady: () => eventsRef.current.onReady(),
    };

    import('@/game/engine/create-game')
      .then(({ createGame }) => {
        // Unmounted (or StrictMode's first pass) before the chunk arrived.
        if (cancelled || !containerRef.current) return;
        eventsRef.current.onEngineLoaded();
        handleRef.current = createGame(containerRef.current, bridge);
      })
      .catch((error: unknown) => {
        if (!cancelled) eventsRef.current.onError(error);
      });

    return () => {
      cancelled = true;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (entered) handleRef.current?.enterWorld();
  }, [entered]);

  return <div ref={containerRef} className={className} aria-label="Game world" role="application" />;
}
