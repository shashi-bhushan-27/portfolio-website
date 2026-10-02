'use client';

import { useCallback, useState } from 'react';
import { PhaserGame } from '@/game/phaser-game';
import { BootScreen } from '@/game/ui/boot-screen';
import { ControlsHint } from '@/game/ui/controls-hint';
import { GameError } from '@/game/ui/game-error';
import { GameFrame } from '@/game/ui/game-frame';
import type { RendererKind } from '@/game/engine/types';

/** The /play experience: boot sequence → world, with the engine mounted underneath. */
export default function GameShell() {
  const [engineLoaded, setEngineLoaded] = useState(false);
  const [renderer, setRenderer] = useState<RendererKind | null>(null);
  const [assets, setAssets] = useState(0);
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const enter = useCallback(() => setEntered(true), []);

  if (error) {
    return (
      <GameFrame>
        <GameError error={error} onRetry={() => window.location.reload()} />
      </GameFrame>
    );
  }

  return (
    <GameFrame status={entered ? 'v0.1 · prototype world' : 'v0.1 · booting'}>
      <PhaserGame
        className="absolute inset-0"
        entered={entered}
        onEngineLoaded={() => setEngineLoaded(true)}
        onRendererReady={setRenderer}
        onAssetProgress={setAssets}
        onReady={() => setReady(true)}
        onError={setError}
      />
      {entered ? (
        <ControlsHint />
      ) : (
        <div className="absolute inset-0 bg-bg">
          <BootScreen
            state={{ shellLoaded: true, engineLoaded, renderer, assets, ready }}
            onEnter={enter}
          />
        </div>
      )}
    </GameFrame>
  );
}
