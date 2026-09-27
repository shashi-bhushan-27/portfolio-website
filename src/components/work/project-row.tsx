import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ProjectData } from '@/lib/types';

/** One line of the project index. Hook-free, so it renders on the server or inside client lists. */
export function ProjectRow({
  project: p,
  n,
  showStack = false,
}: {
  project: ProjectData;
  n: number;
  showStack?: boolean;
}) {
  const metrics = Object.entries(p.metrics ?? {}).slice(0, 3);
  return (
    <li className="border-b border-line">
      <Link
        href={`/work/${p.slug}`}
        className="group relative grid gap-x-8 gap-y-3 py-7 md:grid-cols-[3rem_minmax(0,1.4fr)_minmax(0,1fr)_6rem]"
      >
        <span
          aria-hidden
          className="absolute inset-y-0 -left-4 w-px origin-top scale-y-0 bg-signal transition-transform duration-300 group-hover:scale-y-100 sm:-left-6 lg:-left-8"
        />
        <span className="label-mono pt-1.5 text-fg-faint">{String(n).padStart(2, '0')}</span>
        <div>
          <h3 className="text-xl font-medium tracking-[-0.02em] text-fg transition-colors group-hover:text-signal-ink sm:text-[22px]">
            {p.title}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-muted">{p.excerpt}</p>
          {showStack && p.technologies.length > 0 && (
            <p className="mt-4 font-mono text-[11.5px] leading-relaxed text-fg-faint">
              {p.technologies.join(' · ')}
            </p>
          )}
        </div>
        <div className="space-y-3">
          <p className="label-mono text-fg-muted">{p.domain}</p>
          {metrics.length > 0 && (
            <dl className="grid gap-1 font-mono text-[12px]">
              {metrics.map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="shrink-0 text-fg-faint lowercase">{k}</dt>
                  <dd className="truncate text-fg">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <span className="label-mono flex items-start justify-between gap-2 pt-1 text-fg-faint md:justify-end">
          {p.year}
          <ArrowUpRight className="size-4 -translate-y-0.5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-0.5 group-hover:text-signal-ink" />
        </span>
      </Link>
    </li>
  );
}
