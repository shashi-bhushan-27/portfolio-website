'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Award, Briefcase, Keyboard, LogOut, Play, RotateCcw, ScrollText, Volume2, VolumeX, Waves } from 'lucide-react';
import { gameStore, useGame } from '@/game/store/game-store';
import { trackGame } from '@/game/analytics';
import { CONTROLS } from '@/game/ui/controls-hint';
import { Panel } from '@/game/ui/panel';
import { cn } from '@/lib/utils';

const row =
  'flex w-full items-center gap-3 border-b border-line px-1 py-3 text-left text-sm text-fg transition-colors hover:bg-surface focus-visible:bg-surface';

export function PauseMenu({ onClose }: { onClose: () => void }) {
  const settings = useGame((s) => s.settings);
  const persistence = useGame((s) => s.persistence);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const store = gameStore.getState();
  const motionLabel = settings.reducedMotion === null ? 'Follow system' : settings.reducedMotion ? 'Reduced' : 'Full';

  return (
    <Panel kicker="Paused" title="Menu" onClose={onClose} size="sm">
      <div className="border-t border-line">
        <button type="button" data-autofocus onClick={onClose} className={row}>
          <Play className="size-4 text-signal-ink" /> Resume
        </button>
        <button type="button" onClick={() => store.openPanel({ kind: 'quests' })} className={row}>
          <ScrollText className="size-4 text-fg-muted" /> Quest log
        </button>
        <button type="button" onClick={() => store.openPanel({ kind: 'achievements' })} className={row}>
          <Award className="size-4 text-fg-muted" /> Achievements
        </button>
        <button
          type="button"
          onClick={() => {
            trackGame('recruiter_mode_opened', { from: 'menu' });
            store.openPanel({ kind: 'recruiter' });
          }}
          className={row}
        >
          <Briefcase className="size-4 text-fg-muted" /> Recruiter mode
          <span className="label-mono ml-auto text-fg-faint">skip the game</span>
        </button>
        <button type="button" aria-expanded={showControls} onClick={() => setShowControls((v) => !v)} className={row}>
          <Keyboard className="size-4 text-fg-muted" /> Controls
        </button>
        {showControls && (
          <dl className="grid grid-cols-[5rem_minmax(0,1fr)] gap-y-1.5 border-b border-line px-1 py-3 font-mono text-[12px]">
            {CONTROLS.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-fg-faint">{k}</dt>
                <dd className="text-fg">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        <button type="button" onClick={() => store.setSound(!settings.sound)} className={row} aria-pressed={settings.sound}>
          {settings.sound ? <Volume2 className="size-4 text-fg-muted" /> : <VolumeX className="size-4 text-fg-muted" />}
          Sound
          <span className="label-mono ml-auto text-fg-faint">{settings.sound ? 'On' : 'Off'} · M</span>
        </button>
        <button
          type="button"
          onClick={() =>
            store.setReducedMotion(settings.reducedMotion === null ? true : settings.reducedMotion ? false : null)
          }
          className={row}
        >
          <Waves className="size-4 text-fg-muted" /> Motion
          <span className="label-mono ml-auto text-fg-faint">{motionLabel}</span>
        </button>
        {confirmReset ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-1 py-3 text-sm">
            <span className="text-fg">Erase all progress?</span>
            <button type="button" onClick={() => store.resetProgress()} className="ml-auto border border-danger/50 px-2.5 py-1 text-danger hover:bg-danger/10">
              Erase
            </button>
            <button type="button" onClick={() => setConfirmReset(false)} className="border border-line px-2.5 py-1 text-fg-muted hover:text-fg">
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmReset(true)} className={cn(row, 'text-fg-muted')}>
            <RotateCcw className="size-4" /> Reset progress
            {persistence === 'unavailable' && <span className="label-mono ml-auto text-fg-faint">not saved here</span>}
          </button>
        )}
        <Link href="/" className={row}>
          <LogOut className="size-4 text-fg-muted" /> Exit to portfolio
        </Link>
      </div>
    </Panel>
  );
}
