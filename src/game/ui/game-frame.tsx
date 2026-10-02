import Link from 'next/link';
import { X } from 'lucide-react';
import { buttonStyles } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Full-viewport chrome for /play: title bar with an always-visible exit, and the stage
 * below it. Always dark, whatever the site theme — the canvas palette assumes it.
 */
export function GameFrame({ children, status }: { children: React.ReactNode; status?: string }) {
  return (
    <div data-game-root className="dark fixed inset-0 flex flex-col bg-bg text-fg">
      <header className="flex h-12 shrink-0 items-center gap-4 border-b border-line px-3 sm:px-4">
        <span className="label-mono flex items-center gap-2 text-fg">
          <span aria-hidden className="size-1.5 bg-signal" />
          SHASHI.EXE
        </span>
        {status && <span className="label-mono hidden text-fg-faint sm:inline">{status}</span>}
        <Link href="/" className={cn(buttonStyles({ variant: 'ghost', size: 'sm' }), 'ml-auto')}>
          <X className="size-3.5" />
          Exit game
        </Link>
      </header>
      <main className="relative flex-1 overflow-hidden bg-blueprint">{children}</main>
    </div>
  );
}
