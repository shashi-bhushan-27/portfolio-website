'use client';

import dynamic from 'next/dynamic';
import { BootScreen } from '@/game/ui/boot-screen';
import { GameFrame } from '@/game/ui/game-frame';

// Client-only, and split from the route: the shell (and Phaser behind it) downloads
// after /play renders. The boot screen is the server-rendered placeholder meanwhile.
const GameShell = dynamic(() => import('@/game/game-shell'), {
  ssr: false,
  loading: () => (
    <GameFrame status="v0.1 · booting">
      <div className="absolute inset-0 bg-bg">
        <BootScreen
          state={{ shellLoaded: false, engineLoaded: false, renderer: null, assets: 0, ready: false }}
        />
      </div>
    </GameFrame>
  ),
});

export function GameLoader() {
  return <GameShell />;
}
