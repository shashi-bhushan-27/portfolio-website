import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Entry to the optional RPG. A plain link with prefetch off: nothing from /play
 * (let alone Phaser) is fetched until someone actually clicks it.
 */
export function PlayGameLink({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <Link
      href="/play"
      prefetch={false}
      style={style}
      className={cn(
        'group inline-flex items-center gap-3 rounded-[4px] border border-dashed border-border px-3 py-2 font-mono text-[12.5px] text-fg-muted transition-colors hover:border-signal-ink hover:text-fg',
        className
      )}
    >
      <span aria-hidden className="text-signal-ink">&gt;_</span>
      <span>
        <span className="text-fg">play shashi.exe</span>
        <span className="hidden sm:inline"> — the portfolio as a small RPG</span>
      </span>
      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
