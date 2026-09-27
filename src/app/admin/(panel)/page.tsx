import type { Metadata } from 'next';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { serializeArticle, toSummary } from '@/lib/articles';
import { wordCount } from '@/lib/markdown';
import { AdminHeader } from '@/components/admin/admin-header';
import { ArticleTable } from '@/components/admin/article-table';
import { buttonStyles } from '@/components/ui/button';
import { createDraft } from '@/app/admin/actions';

export const metadata: Metadata = { title: 'Articles' };

export default async function AdminDashboard() {
  await requireAdmin();

  const rows = await prisma.article.findMany({ orderBy: { updatedAt: 'desc' } });
  const articles = rows.map((r) => ({
    ...toSummary(serializeArticle(r)),
    words: wordCount(r.content ?? ''),
  }));

  const published = articles.filter((a) => a.status === 'PUBLISHED');
  const drafts = articles.length - published.length;
  const words = published.reduce((n, a) => n + a.words, 0);
  const latest = published
    .map((a) => a.publishedAt)
    .sort()
    .at(-1);

  const stats = [
    ['Published', published.length],
    ['Drafts', drafts],
    ['Words live', words.toLocaleString('en-US')],
    ['Last published', latest ? latest.slice(0, 10) : '—'],
  ] as const;

  return (
    <>
      <AdminHeader>
        <span className="text-[13px] text-fg-muted">Articles</span>
      </AdminHeader>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-medium tracking-[-0.03em]">Articles</h1>
            <p className="mt-1.5 text-sm text-fg-muted">
              Publishing or updating a published article refreshes the live site immediately.
            </p>
          </div>
          <form action={createDraft}>
            <button type="submit" className={buttonStyles({ variant: 'primary' })}>
              <Plus className="size-4" />
              New article
            </button>
          </form>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label} className="bg-bg px-4 py-3.5">
              <dt className="label-mono text-fg-faint">{label}</dt>
              <dd className="mt-1 font-mono text-xl tracking-tight tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <ArticleTable articles={articles} />
      </main>
    </>
  );
}
