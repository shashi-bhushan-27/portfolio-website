'use client';

import { useCallback, useEffect, useState } from 'react';
import { Briefcase, Volume2, VolumeX } from 'lucide-react';
import { trackGame } from '@/game/analytics';
import { AREAS } from '@/game/data/world';
import { PhaserGame } from '@/game/phaser-game';
import { gameStore, useGame } from '@/game/store/game-store';
import { BootScreen } from '@/game/ui/boot-screen';
import { ControlsHint } from '@/game/ui/controls-hint';
import { GameError } from '@/game/ui/game-error';
import { GameFrame } from '@/game/ui/game-frame';
import { AreaBanner, Hud, InteractHint, Toasts } from '@/game/ui/hud';
import { OverlayRoot } from '@/game/ui/overlay-root';
import { useReducedMotion } from '@/game/ui/use-reduced-motion';
import type { RendererKind } from '@/game/engine/types';
import { cn } from '@/lib/utils';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** The /play experience: boot sequence → world, with the engine mounted underneath. */
export default function GameShell({ publishedSlugs = [] }: { publishedSlugs?: string[] }) {
  const [engineLoaded, setEngineLoaded] = useState(false);
  const [renderer, setRenderer] = useState<RendererKind | null>(null);
  const [assets, setAssets] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const entered = useGame((s) => s.entered);
  const area = useGame((s) => s.area);
  const reduced = useReducedMotion();

  useEffect(() => {
    gameStore.getState().init(publishedSlugs);
  }, [publishedSlugs]);

  const enter = useCallback(() => {
    if (gameStore.getState().panel) return;
    gameStore.getState().enterWorld();
  }, []);

  useEffect(() => {
    if (entered) document.getElementById('game-world')?.focus({ preventScroll: true });
  }, [entered]);

  useEffect(() => {
    let konami = 0;
    const onKey = (e: KeyboardEvent) => {
      const s = gameStore.getState();
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      konami = key === KONAMI[konami] ? konami + 1 : key === KONAMI[0] ? 1 : 0;
      if (konami === KONAMI.length) {
        konami = 0;
        if (s.entered) s.konami();
      }

      if (e.key === 'Escape') {
        if (s.panel) s.closePanel();
        else if (s.entered) s.openPanel({ kind: 'pause' });
        return;
      }
      const target = e.target as HTMLElement | null;
      if (!s.entered || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (target && (TYPING.has(target.tagName) || target.isContentEditable)) return;
      if (e.code === 'KeyM') s.setSound(!s.settings.sound);
      if (e.code === 'KeyQ' && !s.panel) s.openPanel({ kind: 'quests' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (error) {
    return (
      <GameFrame>
        <GameError error={error} onRetry={() => window.location.reload()} />
      </GameFrame>
    );
  }

  const areaName = AREAS.find((a) => a.id === area)?.name;

  return (
    <GameFrame status={entered ? (areaName ?? 'v1.0') : 'v1.0 · booting'}>
        <PhaserGame
          className="absolute inset-0 outline-none"
          entered={entered}
          onEngineLoaded={() => setEngineLoaded(true)}
          onRendererReady={setRenderer}
          onAssetProgress={setAssets}
          onReady={() => setReady(true)}
          onError={setError}
        />
        {entered ? (
          <>
            <Hud />
            <AreaBanner />
            <InteractHint />
            <ControlsHint />
          </>
        ) : (
          <div className="absolute inset-0 bg-bg">
            <BootScreen
              state={{ shellLoaded: true, engineLoaded, renderer, assets, ready }}
              onEnter={enter}
              still={reduced}
              extras={<BootExtras />}
            />
          </div>
        )}
        <Toasts />
        <OverlayRoot />
    </GameFrame>
  );
}

/** Sound choice and the no-game shortcut, on the boot screen. */
function BootExtras() {
  const sound = useGame((s) => s.settings.sound);
  const store = gameStore.getState();
  const choice = (on: boolean) =>
    cn(
      'flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[12px] transition-colors',
      sound === on ? 'border-signal-ink bg-signal/10 text-fg' : 'border-line text-fg-muted hover:text-fg'
    );
  return (
    <div className="mt-8 space-y-4 border-t border-line pt-5">
      <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Sound">
        <span className="label-mono w-14 text-fg-faint">Sound</span>
        <button type="button" aria-pressed={sound} onClick={() => store.setSound(true)} className={choice(true)}>
          <Volume2 className="size-3.5" /> On
        </button>
        <button type="button" aria-pressed={!sound} onClick={() => store.setSound(false)} className={choice(false)}>
          <VolumeX className="size-3.5" /> Off
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          trackGame('recruiter_mode_opened', { from: 'boot' });
          store.openPanel({ kind: 'recruiter' });
        }}
        className="flex items-center gap-2 text-left text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <Briefcase className="size-4 text-signal-ink" />
        <span>
          <span className="text-fg">Recruiter mode</span> — the whole profile on one card, no game required
        </span>
      </button>
    </div>
  );
}
