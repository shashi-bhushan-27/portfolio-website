import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { serializeArticle } from '@/lib/articles';
import { editorSuggestions } from '@/lib/admin-data';
import { ArticleEditor } from '@/components/admin/article-editor';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await requireAdmin();
  const { id } = await params;
  const row = await prisma.article.findUnique({ where: { id }, select: { title: true } });
  return { title: row?.title ? `Edit · ${row.title}` : 'Edit article' };
}

export default async function EditArticlePage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const [row, { categories, tags }] = await Promise.all([
    prisma.article.findUnique({ where: { id } }),
    editorSuggestions(),
  ]);
  if (!row) notFound();

  // key: remount the editor when switching articles so no state leaks between them.
  return (
    <ArticleEditor
      key={row.id}
      article={serializeArticle(row)}
      categories={categories}
      tagSuggestions={tags}
    />
  );
}
