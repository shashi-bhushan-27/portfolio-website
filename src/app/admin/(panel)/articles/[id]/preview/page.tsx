import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { serializeArticle } from '@/lib/articles';
import { ArticleView } from '@/components/insights/article-view';

export const metadata: Metadata = { title: 'Preview' };

type Props = { params: Promise<{ id: string }> };

/** The article exactly as the public page renders it — including drafts. */
export default async function PreviewArticlePage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const row = await prisma.article.findUnique({ where: { id } });
  if (!row) notFound();
  const article = serializeArticle(row);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[60] flex h-10 items-center gap-3 border-b border-warn/30 bg-bg/90 px-4 backdrop-blur">
        <span className="size-1.5 bg-warn" />
        <span className="label-mono text-fg">
          Preview · {article.status === 'PUBLISHED' ? 'live version' : 'draft, not public'}
        </span>
        <Link href={`/admin/articles/${id}`} className="label-mono ml-auto text-fg-muted link-underline hover:text-fg">
          Back to editor
        </Link>
      </div>
      <ArticleView article={article} />
      <div className="h-24" />
    </>
  );
}
