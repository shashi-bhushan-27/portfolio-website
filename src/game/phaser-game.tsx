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

/** If the renderer hasn't come up by now, something failed inside Phaser's own callbacks. */
const BOOT_TIMEOUT_MS = 10_000;

/** Resolves once the element has a non-zero size (WebGL can't create a 0×0 framebuffer). */
function whenSized(el: HTMLElement, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (el.clientWidth > 0 && el.clientHeight > 0) return resolve();
    const ro = new ResizeObserver(() => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        ro.disconnect();
        resolve();
      }
    });
    ro.observe(el);
    signal.addEventListener('abort', () => ro.disconnect());
  });
}

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
    const abort = new AbortController();
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    const fail = (error: unknown) => {
      if (!abort.signal.aborted) eventsRef.current.onError(error);
    };
    const bridge: GameBridge = {
      onRendererReady: (renderer) => {
        clearTimeout(watchdog);
        eventsRef.current.onRendererReady(renderer);
      },
      onAssetProgress: (progress) => eventsRef.current.onAssetProgress(progress),
      onReady: () => eventsRef.current.onReady(),
    };

    import('@/game/engine/create-game')
      .then(async ({ createGame }) => {
        const el = containerRef.current;
        // Unmounted (or StrictMode's first pass) before the chunk arrived.
        if (abort.signal.aborted || !el) return;
        eventsRef.current.onEngineLoaded();
        await whenSized(el, abort.signal);
        if (abort.signal.aborted) return;
        watchdog = setTimeout(() => fail(new Error('The game engine didn’t finish starting.')), BOOT_TIMEOUT_MS);
        handleRef.current = createGame(el, bridge);
      })
      .catch(fail);

    return () => {
      abort.abort();
      clearTimeout(watchdog);
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (entered) handleRef.current?.enterWorld();
  }, [entered]);

  return (
    <div
      ref={containerRef}
      id="game-world"
      tabIndex={-1}
      className={className}
      role="application"
      aria-label="SHASHI.EXE game world. Move with W A S D or the arrow keys, interact with E."
    />
  );
}
