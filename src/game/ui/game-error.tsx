'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { buttonStyles } from '@/components/ui/button';

/** Shown when the engine can't load or start. The portfolio is always one click away. */
export function GameError({ error, onRetry }: { error?: unknown; onRetry?: () => void }) {
  useEffect(() => {
    if (error) console.error('[shashi.exe] failed to start', error);
  }, [error]);

  const detail = error instanceof Error ? `${error.name}: ${error.message}` : null;

  return (
    <section aria-labelledby="game-error-title" className="absolute inset-0 overflow-y-auto">
      <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-10">
        <p className="label-mono text-danger">Boot failed</p>
        <h1 id="game-error-title" className="mt-3 font-mono text-2xl tracking-[-0.03em] text-fg">
          SHASHI.EXE couldn&apos;t start.
        </h1>
        <p className="mt-4 leading-relaxed text-fg-muted">
          No worries — you can still explore the normal portfolio.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className={buttonStyles({ variant: 'primary', size: 'lg' })}>
            Back to portfolio
          </Link>
          {onRetry && (
            <button type="button" onClick={onRetry} className={buttonStyles({ size: 'lg' })}>
              <RotateCcw className="size-4" />
              Try again
            </button>
          )}
        </div>
        {detail && <p className="mt-10 font-mono text-[11px] break-words text-fg-faint">{detail}</p>}
      </div>
    </section>
  );
}
