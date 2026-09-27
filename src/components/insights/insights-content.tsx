'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Search } from 'lucide-react';
import type { ArticleSummary } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

function PinnedCard({ article, n }: { article: ArticleSummary; n: number }) {
  return (
    <Link
      href={`/insights/${article.slug}`}
      className="group relative flex min-h-[280px] flex-col overflow-hidden bg-bg p-6 transition-colors duration-300 hover:bg-surface"
    >
      {/* sheen that follows the card edge on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      <div className="flex items-center justify-between">
        <span className="label-mono text-fg-faint">
          {String(n).padStart(2, '0')} / pinned
        </span>
        <ArrowUpRight className="size-4 text-fg-faint transition-[color,transform] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal-ink" />
      </div>
      <h3 className="mt-10 text-xl font-medium leading-snug tracking-[-0.02em] text-fg text-balance">
        {article.title}
      </h3>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-fg-muted">
        {article.excerpt}
      </p>
      <p className="label-mono mt-auto flex flex-wrap gap-x-3 pt-6 text-fg-faint">
        <span>{article.category}</span>
        <span>{formatDate(article.publishedAt, 'iso')}</span>
        <span>{article.readingTime} min</span>
      </p>
    </Link>
  );
}

function ArchiveRow({ article }: { article: ArticleSummary }) {
  return (
    <li className="border-b border-line">
      <Link
        href={`/insights/${article.slug}`}
        className="group grid gap-x-6 gap-y-1 py-5 sm:grid-cols-[5.5rem_1fr_auto] sm:items-baseline"
      >
        <time dateTime={article.publishedAt} className="label-mono text-fg-faint">
          {formatDate(article.publishedAt, 'short').replace(/, \d{4}$/, '')}
        </time>
        <div className="min-w-0">
          <h3 className="text-[17px] font-medium tracking-[-0.01em] text-fg transition-colors group-hover:text-signal-ink">
            {article.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-fg-muted sm:line-clamp-1">
            {article.excerpt}
          </p>
        </div>
        <p className="label-mono flex gap-3 text-fg-faint sm:justify-end">
          <span className="hidden md:inline">{article.category}</span>
          <span>{article.readingTime} min</span>
        </p>
      </Link>
    </li>
  );
}

export function InsightsContent({ articles }: { articles: ArticleSummary[] }) {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" focuses search, like most docs sites.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === '/' && !/input|textarea/i.test(target.tagName) && !target.isContentEditable) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of articles) counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
    return [['All', articles.length] as const, ...counts.entries()];
  }, [articles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter(
      (a) =>
        (category === 'All' || a.category === category) &&
        (!q ||
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [articles, category, query]);

  const browsing = category === 'All' && !query.trim();
  const pinned = browsing ? articles.filter((a) => a.featured).slice(0, 3) : [];

  const byYear = useMemo(() => {
    const groups = new Map<string, ArticleSummary[]>();
    for (const a of filtered) {
      const y = a.publishedAt.slice(0, 4);
      groups.set(y, [...(groups.get(y) ?? []), a]);
    }
    return [...groups.entries()];
  }, [filtered]);

  return (
    <div className="container-page">
      {pinned.length > 0 && (
        <section aria-label="Pinned articles" className="mb-20 grid gap-px border border-line bg-line md:grid-cols-3">
          {pinned.map((a, i) => (
            <PinnedCard key={a.slug} article={a} n={i + 1} />
          ))}
        </section>
      )}

      <section aria-label="Archive">
        <div className="flex flex-col gap-5 border-y border-line py-4 lg:flex-row lg:items-center">
          <div className="-mx-1 flex flex-wrap gap-1" role="tablist" aria-label="Filter by category">
            {categories.map(([name, count]) => (
              <button
                key={name}
                role="tab"
                aria-selected={category === name}
                onClick={() => setCategory(name)}
                className={cn(
                  'rounded-[4px] px-2.5 py-1.5 text-[13px] transition-colors',
                  category === name
                    ? 'bg-fg text-bg'
                    : 'text-fg-muted hover:bg-surface hover:text-fg'
                )}
              >
                {name}
                <span className={cn('ml-1.5 font-mono text-[11px]', category === name ? 'opacity-60' : 'text-fg-faint')}>
                  {count}
                </span>
              </button>
            ))}
          </div>
          <label className="relative lg:ml-auto lg:w-72">
            <span className="sr-only">Search articles</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-fg-faint" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, tags…"
              className="h-9 w-full rounded-[4px] border border-line bg-transparent pr-8 pl-8 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-border"
            />
            <kbd className="label-mono pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-fg-faint">
              /
            </kbd>
          </label>
        </div>

        {byYear.map(([year, list]) => (
          <div key={year} className="grid gap-x-6 pt-10 md:grid-cols-[8rem_1fr]">
            <h2 className="label-mono pt-5 text-fg-faint md:sticky md:top-20 md:self-start">
              {year}
              <span className="ml-2 text-fg-faint/60">({list.length})</span>
            </h2>
            <ul className="border-t border-line md:border-t-0">
              {list.map((a) => (
                <ArchiveRow key={a.slug} article={a} />
              ))}
            </ul>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-fg-muted">
              Nothing matches{query ? ` “${query}”` : ''}
              {category !== 'All' ? ` in ${category}` : ''}.
            </p>
            <button
              onClick={() => {
                setQuery('');
                setCategory('All');
              }}
              className="label-mono mt-4 text-signal-ink link-underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
