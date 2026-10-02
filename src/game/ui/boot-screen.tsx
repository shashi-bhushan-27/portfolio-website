'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { CornerDownLeft } from 'lucide-react';
import { buttonStyles } from '@/components/ui/button';
import type { RendererKind } from '@/game/engine/types';
import { cn } from '@/lib/utils';

export type BootState = {
  shellLoaded: boolean;
  engineLoaded: boolean;
  renderer: RendererKind | null;
  /** 0–1 */
  assets: number;
  ready: boolean;
};

const CELLS = 24;

/** Each line is a real boot stage; the weights roughly follow how long each one takes. */
function stages(s: BootState) {
  return [
    { label: 'Loading game shell', done: s.shellLoaded, weight: 0.15 },
    { label: 'Loading engine · Phaser 3', done: s.engineLoaded, weight: 0.5 },
    {
      label: s.renderer ? `Starting renderer · ${s.renderer}` : 'Starting renderer',
      done: s.renderer !== null,
      weight: 0.1,
    },
    { label: 'Loading world assets', done: s.ready, weight: 0.2, partial: s.assets },
    { label: 'Loading questionable ideas', done: s.ready, weight: 0.05 },
  ];
}

export function BootScreen({
  state,
  onEnter,
  extras,
  still,
}: {
  state: BootState;
  onEnter?: () => void;
  /** Settings and shortcuts the shell adds once it has loaded. */
  extras?: React.ReactNode;
  /** Reduced motion: no blinking caret. */
  still?: boolean;
}) {
  const steps = stages(state);
  const progress = steps.reduce((sum, s) => sum + s.weight * (s.done ? 1 : (s.partial ?? 0)), 0);
  const pct = Math.round(progress * 100);
  const active = steps.find((s) => !s.done);
  const enterRef = useRef<HTMLButtonElement>(null);
  const { ready } = state;

  useEffect(() => {
    if (!ready || !onEnter) return;
    // Don't steal focus from something the visitor already tabbed to.
    if (document.activeElement === document.body) enterRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      // A focused button or link handles Enter itself.
      if (e.key !== 'Enter' || (e.target instanceof Element && e.target.closest('a, button'))) return;
      e.preventDefault();
      onEnter();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready, onEnter]);

  return (
    <section aria-labelledby="boot-title" className="absolute inset-0 overflow-y-auto">
      <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-10">
        <p className="label-mono text-fg-faint">Interactive portfolio</p>
        <h1 id="boot-title" className="mt-3 font-mono text-2xl tracking-[-0.03em] text-fg sm:text-[28px]">
          {ready ? 'Developer world ready' : 'Booting developer world'}
          <span aria-hidden className={cn('ml-1 text-signal-ink', !still && 'animate-[blink_1s_steps(1)_infinite]')}>
            _
          </span>
        </h1>

        <ol className="mt-8 space-y-2.5 font-mono text-[13px]">
          {steps.map((s) => (
            <li key={s.label} className="flex items-baseline gap-2">
              <span className={s.done ? 'text-fg' : s === active ? 'text-fg-muted' : 'text-fg-faint'}>
                {s.label}
              </span>
              <span aria-hidden className="mb-1 flex-1 border-b border-dotted border-border" />
              <span className="w-9 text-right tabular-nums">
                {s.done ? (
                  <span className="text-signal-ink">✓</span>
                ) : s === active ? (
                  <span className="text-fg-muted">
                    {s.partial ? `${Math.round(s.partial * 100)}%` : '…'}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex items-center gap-3">
          <div
            role="progressbar"
            aria-label="Boot progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            className="flex h-3 flex-1 gap-[3px]"
          >
            {Array.from({ length: CELLS }, (_, i) => (
              <span
                key={i}
                className={cn('flex-1', i < Math.round(progress * CELLS) ? 'bg-signal' : 'bg-surface-2')}
              />
            ))}
          </div>
          <span className="w-10 text-right font-mono text-[13px] text-fg-muted tabular-nums">{pct}%</span>
        </div>

        <p className="sr-only" aria-live="polite">
          {ready ? 'Ready. Press Enter to start.' : active ? `${active.label}…` : ''}
        </p>

        <div className="mt-10 flex min-h-12 flex-wrap items-center gap-x-5 gap-y-3">
          {ready && onEnter && (
            <button
              ref={enterRef}
              type="button"
              onClick={onEnter}
              className={buttonStyles({ variant: 'primary', size: 'lg' })}
            >
              Enter the world
              <CornerDownLeft className="size-4" />
            </button>
          )}
          <Link href="/" className="label-mono text-fg-muted link-underline hover:text-fg">
            Skip game
          </Link>
        </div>
        {ready && (
          <p className="label-mono mt-3 text-fg-faint [@media(pointer:coarse)]:hidden">Press Enter</p>
        )}

        {extras}

        <p className="mt-12 max-w-sm border-t border-line pt-5 text-sm leading-relaxed text-fg-muted">
          A small, optional, playable take on the portfolio. Everything in it is also on the
          regular site.
        </p>
      </div>
    </section>
  );
}
