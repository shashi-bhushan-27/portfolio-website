'use client';

import { ArrowUpRight } from 'lucide-react';
import { trackGame, type GameEvent } from '@/game/analytics';
import { buttonStyles } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Links out of the game open in a new tab, so the world (and your progress) stays put.
 */
export function OutLink({
  href,
  children,
  event,
  variant = 'secondary',
  className,
}: {
  href: string;
  children: React.ReactNode;
  event?: GameEvent;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => event && trackGame(event)}
      className={cn(buttonStyles({ variant, size: 'sm' }), className)}
    >
      {children}
      <ArrowUpRight className="size-3.5" />
    </a>
  );
}

export function TechChips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <li key={t} className="rounded-[3px] border border-line px-2 py-0.5 font-mono text-[11.5px] text-fg-muted">
          {t}
        </li>
      ))}
    </ul>
  );
}

export function Metrics({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3">
      {items.map((m) => (
        <div key={m.label} className="bg-bg px-3 py-2.5">
          <dt className="label-mono text-fg-faint">{m.label}</dt>
          <dd className="mt-1 font-mono text-[15px] tracking-tight text-fg tabular-nums">{m.value}</dd>
        </div>
      ))}
    </dl>
  );
}
