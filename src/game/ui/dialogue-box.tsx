'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DIALOGUES, type Dialogue, type DialogueId } from '@/game/data/dialogues';
import { gameStore } from '@/game/store/game-store';
import { audio } from '@/game/systems/audio';
import { PixelPortrait } from '@/game/ui/pixel-portrait';
import { useReducedMotion } from '@/game/ui/use-reduced-motion';
import { useFocusTrap } from '@/game/ui/panel';
import { useAppear } from '@/game/ui/use-appear';

const PAGE_CONTROLS = new Set(['INPUT', 'TEXTAREA', 'BUTTON', 'A', 'SELECT']);

export function DialogueBox({ id }: { id: DialogueId }) {
  const d: Dialogue = DIALOGUES[id];
  const reduced = useReducedMotion();
  const [line, setLine] = useState(0);
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const ended = useRef(false);
  useFocusTrap(ref);
  useAppear(ref, { opacity: 0, transform: 'translateY(14px)' });

  const text = d.lines[line];
  const typed = reduced ? text.length : Math.min(shown, text.length);
  const lineDone = typed >= text.length;
  const last = line === d.lines.length - 1;
  const showChoices = last && lineDone && !!d.choices;

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => {
      setShown((n) => {
        if (n >= text.length) {
          clearInterval(t);
          return n;
        }
        if (n % 4 === 0) audio.play('blip');
        return n + 1;
      });
    }, 18);
    return () => clearInterval(t);
  }, [text, reduced]);

  useEffect(() => {
    if (last && lineDone && !ended.current) {
      ended.current = true;
      gameStore.getState().dialogueEnded(id);
    }
  }, [last, lineDone, id]);

  useEffect(() => {
    if (showChoices) ref.current?.querySelector<HTMLButtonElement>('[data-autofocus]')?.focus();
  }, [showChoices]);

  const advance = useCallback(() => {
    if (!lineDone) {
      setShown(text.length);
      return;
    }
    if (!last) {
      setLine((l) => l + 1);
      setShown(0);
      return;
    }
    if (!d.choices) gameStore.getState().closePanel();
  }, [lineDone, last, text.length, d.choices]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (showChoices && /^[1-9]$/.test(e.key)) {
        const choice = d.choices?.[Number(e.key) - 1];
        if (choice) {
          e.preventDefault();
          gameStore.getState().dialogueAction(choice.action);
        }
        return;
      }
      if (e.code !== 'KeyE' && e.code !== 'Space' && e.key !== 'Enter') return;
      if (target && PAGE_CONTROLS.has(target.tagName)) return;
      e.preventDefault();
      advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, showChoices, d.choices]);

  return (
    <div className="absolute inset-x-2 bottom-2 z-30 flex justify-center sm:inset-x-6 sm:bottom-6">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={`${d.speaker} says`}
        tabIndex={-1}
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest('button')) advance();
        }}
        className="crosshairs flex w-full max-w-3xl cursor-pointer gap-4 border border-line bg-bg/95 p-4 shadow-2xl shadow-black/40 outline-none sm:p-5"
      >
        <div className="hidden border border-line bg-surface p-1 sm:block">
          <PixelPortrait who={d.portrait} scale={4} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="label-mono flex items-center gap-2 text-signal-ink">
            <span className="sm:hidden">
              <PixelPortrait who={d.portrait} scale={2} />
            </span>
            {d.speaker}
          </p>
          <p className="sr-only" aria-live="polite">
            {text}
          </p>
          <p aria-hidden className="mt-2 min-h-[3.25rem] text-[15px] leading-relaxed text-fg sm:text-base">
            {text.slice(0, typed)}
            {!lineDone && <span className="text-fg-faint">▍</span>}
          </p>

          {showChoices ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {d.choices!.map((c, i) => (
                <button
                  key={c.label}
                  type="button"
                  data-autofocus={i === 0 ? '' : undefined}
                  onClick={() => gameStore.getState().dialogueAction(c.action)}
                  className="flex items-center gap-2 border border-border px-3 py-1.5 text-sm text-fg transition-colors hover:border-signal-ink hover:bg-surface"
                >
                  <span className="font-mono text-[11px] text-fg-faint">{i + 1}</span>
                  {c.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="label-mono mt-3 text-right text-fg-faint">
              {lineDone ? (last ? 'E · close' : 'E · next') : 'E · skip'} ▸
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
