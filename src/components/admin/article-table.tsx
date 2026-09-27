'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Eye, Search, Star, Trash2 } from 'lucide-react';
import { createDraft, deleteArticle, setArticleFlags } from '@/app/admin/actions';
import type { ArticleSummary } from '@/lib/types';
import { cn, formatDate, timeAgo } from '@/lib/utils';

type Row = ArticleSummary & { words: number };
type Filter = 'all' | 'PUBLISHED' | 'DRAFT';

export function StatusPill({ status }: { status: ArticleSummary['status'] }) {
  return (
    <span
      className={cn(
        'label-mono inline-flex items-center gap-1.5 rounded-[3px] px-1.5 py-0.5',
        status === 'PUBLISHED' ? 'bg-signal/15 text-signal-ink' : 'bg-surface-2 text-fg-muted'
      )}
    >
      <span className={cn('size-1.5', status === 'PUBLISHED' ? 'bg-signal' : 'border border-fg-faint')} />
      {status === 'PUBLISHED' ? 'Live' : 'Draft'}
    </span>
  );
}

export function ArticleTable({ articles }: { articles: Row[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter(
      (a) =>
        (filter === 'all' || a.status === filter) &&
        (!q ||
          a.title.toLowerCase().includes(q) ||
          a.slug.includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [articles, filter, query]);

  const counts = {
    all: articles.length,
    PUBLISHED: articles.filter((a) => a.status === 'PUBLISHED').length,
    DRAFT: articles.filter((a) => a.status === 'DRAFT').length,
  };

  function run(id: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(id);
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? 'Something went wrong.');
      setBusy(null);
      setConfirming(null);
      router.refresh();
    });
  }

  return (
    <section className="mt-10">
      <div className="flex flex-col gap-3 border-b border-line pb-3 sm:flex-row sm:items-center">
        <div className="flex gap-1" role="tablist" aria-label="Filter by status">
          {(
            [
              ['all', 'All'],
              ['PUBLISHED', 'Live'],
              ['DRAFT', 'Drafts'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-[4px] px-2.5 py-1.5 text-[13px]',
                filter === key ? 'bg-fg text-bg' : 'text-fg-muted hover:bg-surface hover:text-fg'
              )}
            >
              {label}
              <span className="ml-1.5 font-mono text-[11px] opacity-60">{counts[key]}</span>
            </button>
          ))}
        </div>
        <label className="relative sm:ml-auto sm:w-72">
          <span className="sr-only">Search articles</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-fg-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, slug, tag…"
            className="h-9 w-full rounded-[4px] border border-line bg-transparent pl-8 text-sm outline-none placeholder:text-fg-faint focus:border-border"
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="py-20 text-center text-sm text-fg-muted">
          {articles.length === 0 ? (
            <>
              <form action={createDraft}>
                No articles yet.{' '}
                <button type="submit" className="text-fg link-underline">
                  Write the first one
                </button>
                .
              </form>
            </>
          ) : (
            'Nothing matches.'
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="label-mono py-2.5 pr-4 font-normal text-fg-faint">Title</th>
                <th className="label-mono w-24 py-2.5 pr-4 font-normal text-fg-faint">Status</th>
                <th className="label-mono w-36 py-2.5 pr-4 font-normal text-fg-faint">Category</th>
                <th className="label-mono w-28 py-2.5 pr-4 font-normal text-fg-faint">Date</th>
                <th className="label-mono w-24 py-2.5 pr-4 font-normal text-fg-faint">Edited</th>
                <th className="w-40 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr
                  key={a.id}
                  className={cn('group border-b border-line align-top transition-opacity', busy === a.id && 'opacity-50')}
                >
                  <td className="py-3.5 pr-4">
                    <Link href={`/admin/articles/${a.id}`} className="font-medium text-fg hover:text-signal-ink">
                      {a.title || 'Untitled'}
                    </Link>
                    <p className="mt-1 font-mono text-[11.5px] text-fg-faint">
                      /{a.slug} · {a.words.toLocaleString('en-US')} words · {a.readingTime} min
                    </p>
                  </td>
                  <td className="py-3.5 pr-4">
                    <StatusPill status={a.status} />
                  </td>
                  <td className="py-3.5 pr-4 text-fg-muted">{a.category}</td>
                  <td className="py-3.5 pr-4 font-mono text-[12px] text-fg-muted">
                    {formatDate(a.publishedAt, 'iso')}
                  </td>
                  <td className="py-3.5 pr-4 font-mono text-[12px] text-fg-faint" title={a.updatedAt}>
                    {timeAgo(a.updatedAt)}
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        title={a.featured ? 'Unpin from Insights' : 'Pin on Insights'}
                        aria-pressed={a.featured}
                        onClick={() => run(a.id, () => setArticleFlags(a.id, { featured: !a.featured }))}
                        className="flex size-8 items-center justify-center rounded-[4px] text-fg-faint hover:bg-surface hover:text-fg"
                      >
                        <Star className={cn('size-3.5', a.featured && 'fill-signal text-signal-ink')} />
                      </button>
                      <Link
                        href={`/admin/articles/${a.id}/preview`}
                        title="Preview"
                        className="flex size-8 items-center justify-center rounded-[4px] text-fg-faint hover:bg-surface hover:text-fg"
                      >
                        <Eye className="size-3.5" />
                      </Link>
                      {a.status === 'PUBLISHED' && (
                        <a
                          href={`/insights/${a.slug}`}
                          target="_blank"
                          title="Open live page"
                          className="flex size-8 items-center justify-center rounded-[4px] text-fg-faint hover:bg-surface hover:text-fg"
                        >
                          <ArrowUpRight className="size-3.5" />
                        </a>
                      )}
                      {confirming === a.id ? (
                        <span className="flex items-center gap-1 pl-1">
                          <button
                            type="button"
                            onClick={() => run(a.id, () => deleteArticle(a.id))}
                            className="label-mono rounded-[3px] bg-danger px-2 py-1.5 text-white"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirming(null)}
                            className="label-mono rounded-[3px] px-2 py-1.5 text-fg-muted hover:text-fg"
                          >
                            Keep
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => setConfirming(a.id)}
                          className="flex size-8 items-center justify-center rounded-[4px] text-fg-faint hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
