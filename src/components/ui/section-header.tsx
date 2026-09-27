import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Hairline-topped section heading used across the site:
 *   [02]  Selected work ................................ meta
 */
export function SectionHeader({
  index,
  title,
  meta,
  href,
  hrefLabel,
  className,
}: {
  index: string;
  title: string;
  meta?: React.ReactNode;
  href?: string;
  hrefLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-line pt-5',
        className
      )}
    >
      <span className="label-mono text-fg-faint">[{index}]</span>
      <h2 className="text-xl font-medium tracking-[-0.02em] text-fg sm:text-2xl">
        {title}
      </h2>
      <div className="ml-auto flex items-baseline gap-6">
        {meta && <span className="label-mono text-fg-faint">{meta}</span>}
        {href && (
          <Link
            href={href}
            className="group label-mono inline-flex items-center gap-1 text-fg-muted hover:text-fg"
          >
            {hrefLabel ?? 'View all'}
            <ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

/** Top-of-page heading block for inner pages. */
export function PageHeader({
  path,
  title,
  description,
  meta,
  children,
}: {
  path: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="container-page pt-32 pb-14 sm:pt-40 sm:pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="label-mono text-fg-faint">
          <span className="text-signal-ink">~</span>/{path}
        </p>
        {meta && <p className="label-mono text-fg-faint">{meta}</p>}
      </div>
      <h1 className="mt-6 max-w-4xl text-[clamp(2.5rem,6vw,4.75rem)] font-medium leading-[1.02] tracking-[-0.045em] text-fg text-balance">
        {title}
      </h1>
      {description && (
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted text-pretty">
          {description}
        </p>
      )}
      {children}
    </header>
  );
}
