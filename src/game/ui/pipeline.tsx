'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/game/ui/use-reduced-motion';
import { cn } from '@/lib/utils';

/** A vertical flow diagram; a highlight walks down it like data moving through the system. */
export function Pipeline({ steps, label }: { steps: string[]; label: string }) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setActive((i) => (i + 1) % (steps.length + 2)), 750);
    return () => clearInterval(t);
  }, [reduced, steps.length]);

  return (
    <ol aria-label={label} className="flex flex-col items-stretch">
      {steps.map((step, i) => (
        <li key={step} className="flex flex-col items-center">
          {i > 0 && (
            <span aria-hidden className={cn('font-mono text-xs leading-5', !reduced && active === i ? 'text-signal-ink' : 'text-fg-faint')}>
              ↓
            </span>
          )}
          <span
            className={cn(
              'w-full border px-3 py-1.5 text-center font-mono text-[12.5px] transition-colors duration-300',
              !reduced && active === i ? 'border-signal-ink bg-signal/10 text-fg' : 'border-line text-fg-muted'
            )}
          >
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}
