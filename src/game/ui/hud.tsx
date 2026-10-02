'use client';

import { useEffect, useRef, useState } from 'react';
import { Award, Hand, Menu, ScrollText, Volume2, VolumeX } from 'lucide-react';
import { QUESTS } from '@/game/data/quests';
import { AREAS } from '@/game/data/world';
import { gameStore, useGame, type Toast } from '@/game/store/game-store';
import type { Interactable } from '@/game/systems/world-builder';
import { XpBar } from '@/game/ui/quest-log';
import { useAppear } from '@/game/ui/use-appear';
import { useMediaQuery } from '@/game/ui/use-media-query';
import { cn } from '@/lib/utils';

const iconButton =
  'flex size-9 items-center justify-center border border-line bg-bg/85 text-fg-muted backdrop-blur-sm transition-colors hover:border-border hover:text-fg';

/** Level, XP and the next quest on the left; menus on the right. */
export function Hud() {
  const progress = useGame((s) => s.progress);
  const sound = useGame((s) => s.settings.sound);
  const store = gameStore.getState();
  const next = QUESTS.find((q) => !progress.completedQuests.includes(q.id));
  const [have, need] = next ? next.progress(progress) : [0, 0];

  return (
    <>
      <div className="pointer-events-none absolute top-3 left-3 z-10 w-[min(17rem,calc(100%-12rem))] sm:w-72">
        <div className="pointer-events-auto border border-line bg-bg/85 p-3 backdrop-blur-sm">
          <XpBar xp={progress.xp} />
          <button
            type="button"
            onClick={() => store.openPanel({ kind: 'quests' })}
            className="mt-2.5 block w-full text-left"
          >
            <span className="label-mono text-fg-faint">{progress.introDone ? 'Next quest' : 'Start here'}</span>
            <span className="mt-0.5 block truncate text-[13px] text-fg">
              {!progress.introDone
                ? 'Talk to the Recruiter in the hub'
                : next
                  ? `${next.title} · ${have}/${need}`
                  : 'All quests complete'}
            </span>
          </button>
        </div>
      </div>

      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        <button type="button" aria-label="Quest log (Q)" title="Quest log (Q)" onClick={() => store.openPanel({ kind: 'quests' })} className={iconButton}>
          <ScrollText className="size-4" />
        </button>
        <button type="button" aria-label="Achievements" title="Achievements" onClick={() => store.openPanel({ kind: 'achievements' })} className={iconButton}>
          <Award className="size-4" />
        </button>
        <button
          type="button"
          aria-label={sound ? 'Mute (M)' : 'Turn sound on (M)'}
          aria-pressed={sound}
          title={sound ? 'Mute (M)' : 'Sound on (M)'}
          onClick={() => store.setSound(!sound)}
          className={iconButton}
        >
          {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </button>
        <button type="button" aria-label="Menu (Esc)" title="Menu (Esc)" onClick={() => store.openPanel({ kind: 'pause' })} className={iconButton}>
          <Menu className="size-4" />
        </button>
      </div>
    </>
  );
}

const verb = (it: Interactable) => {
  switch (it.action.kind) {
    case 'npc':
      return it.label;
    case 'project':
      return `Inspect ${it.label}`;
    case 'ai-terminal':
      return `Use the ${it.label}`;
    case 'trophy':
      return `Examine: ${it.label}`;
    case 'secret-wall':
      return 'Knock on the cracked wall';
    case 'panel':
      return `Open the ${it.label.toLowerCase()}`;
    case 'info':
      return it.id === 'coffee' ? 'Make a coffee' : it.id === 'duck' ? 'Talk to the rubber duck' : `Read: ${it.label}`;
  }
};

/** "E · Inspect ProofStack" — or, on touch screens, a button that does it. */
export function InteractHint() {
  const nearby = useGame((s) => s.nearby);
  const panel = useGame((s) => s.panel);
  const touch = useMediaQuery('(pointer: coarse)');
  if (!nearby || panel) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-3">
      {touch ? (
        <button
          type="button"
          onClick={() => gameStore.getState().interact(nearby)}
          className="pointer-events-auto flex items-center gap-2 border border-signal-ink bg-bg/90 px-4 py-3 text-sm text-fg backdrop-blur-sm"
        >
          <Hand className="size-4 text-signal-ink" />
          {verb(nearby)}
        </button>
      ) : (
        <p className="flex items-center gap-2 border border-line bg-bg/85 px-3 py-1.5 text-[13px] text-fg backdrop-blur-sm">
          <kbd className="border border-border px-1.5 font-mono text-[11px] text-signal-ink">E</kbd>
          {verb(nearby)}
        </p>
      )}
    </div>
  );
}

/** Quest, XP and achievement notices. */
export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => gameStore.getState().dismissToast(toasts[0].id), 3200);
    return () => clearTimeout(t);
  }, [toasts]);

  return (
    <div aria-live="polite" className="pointer-events-none absolute top-24 right-3 z-20 flex w-[min(20rem,calc(100%-1.5rem))] flex-col items-end gap-1.5 sm:top-16">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastCard({ toast: t }: { toast: Toast }) {
  const ref = useRef<HTMLDivElement>(null);
  useAppear(ref, { opacity: 0, transform: 'translateX(16px)' }, 200);
  const loud = t.kind === 'quest' || t.kind === 'achievement' || t.kind === 'level';
  return (
    <div ref={ref} className={cn('w-full border bg-bg/92 px-3 py-2 backdrop-blur-sm', loud ? 'border-signal-ink' : 'border-line')}>
      <p className={cn('text-[13px]', t.kind === 'xp' ? 'font-mono text-signal-ink' : 'text-fg')}>{t.title}</p>
      {t.detail && <p className="text-[12px] text-fg-muted">{t.detail}</p>}
    </div>
  );
}

/** The room name, briefly, whenever you walk into a new one. */
export function AreaBanner() {
  const area = useGame((s) => s.area);
  const [shown, setShown] = useState<string | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (!area) return;
    // Defer so the banner is a response to the walk, not part of the render that saw it.
    const show = setTimeout(() => setShown(area), first.current ? 600 : 0);
    first.current = false;
    const hide = setTimeout(() => setShown(null), 2600);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [area]);

  const a = AREAS.find((x) => x.id === shown);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[22%] z-10 flex justify-center">
      {a && <BannerText key={a.id} blurb={a.blurb} name={a.name} />}
    </div>
  );
}

function BannerText({ blurb, name }: { blurb: string; name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useAppear(ref, { opacity: 0, transform: 'translateY(6px)' }, 350);
  return (
    <div ref={ref} className="text-center [text-shadow:0_2px_12px_rgb(0_0_0/0.8)]">
      <p className="label-mono text-signal-ink">{blurb}</p>
      <p className="mt-1 font-mono text-2xl tracking-[-0.02em] text-fg uppercase sm:text-3xl">{name}</p>
    </div>
  );
}
