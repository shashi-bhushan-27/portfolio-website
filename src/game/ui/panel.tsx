'use client';

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useAppear } from '@/game/ui/use-appear';
import { cn } from '@/lib/utils';

const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

/** Keeps Tab inside `root` and focuses its first control (or the root) on mount. */
export function useFocusTrap(root: React.RefObject<HTMLElement | null>, autoFocus = true) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const previous = document.activeElement as HTMLElement | null;
    if (autoFocus) {
      const first = el.querySelector<HTMLElement>('[data-autofocus]') ?? el;
      first.focus({ preventScroll: true });
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('keydown', onKey);
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [root, autoFocus]);
}

type PanelProps = {
  kicker?: string;
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  accent?: React.ReactNode;
};

/** A modal sheet over the game: hairline frame, mono kicker, Esc or × to close. */
export function Panel({ kicker, title, onClose, children, footer, size = 'md', accent }: PanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(ref);
  useAppear(ref);

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-bg/55 p-2 sm:items-center sm:p-6">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'crosshairs flex max-h-[calc(100%-0.5rem)] w-full flex-col border border-line bg-bg shadow-2xl shadow-black/40 outline-none sm:max-h-[min(88%,52rem)]',
          size === 'sm' && 'sm:max-w-md',
          size === 'md' && 'sm:max-w-2xl',
          size === 'lg' && 'sm:max-w-4xl'
        )}
      >
        <header className="flex items-start gap-4 border-b border-line px-4 py-3.5 sm:px-6">
          {accent}
          <div className="min-w-0 flex-1">
            {kicker && <p className="label-mono text-fg-faint">{kicker}</p>}
            <h2 id={titleId} className="mt-1 text-lg leading-snug font-medium tracking-[-0.02em] text-fg text-balance sm:text-xl">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close (Esc)"
            className="-mr-1.5 flex size-8 shrink-0 items-center justify-center rounded-[4px] text-fg-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</div>
        {footer && <footer className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3 sm:px-6">{footer}</footer>}
      </div>
    </div>
  );
}

/** Small uppercase heading for a block inside a panel. */
export function PanelSection({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('mt-6 first:mt-0', className)}>
      <h3 className="label-mono text-fg-faint">{label}</h3>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}
