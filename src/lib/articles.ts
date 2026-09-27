import 'server-only';
import type { Article } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ArticleData, ArticleSummary } from '@/lib/types';

export function serializeArticle(a: Article): ArticleData {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    content: a.content,
    category: a.category,
    readingTime: a.readingTime,
    publishedAt: a.publishedAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    tags: a.tags,
    featured: a.featured,
    status: a.status,
    coverImage: a.coverImage,
  };
}

export function toSummary({ content: _content, ...rest }: ArticleData): ArticleSummary {
  return rest;
}

/** Published articles, newest first. Bodies are omitted — listings never need them. */
export async function getPublishedArticles(limit?: number): Promise<ArticleSummary[]> {
  const rows = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });
  return rows.map((r) => toSummary(serializeArticle(r)));
}

export async function getPublishedArticle(slug: string): Promise<ArticleData | null> {
  const row = await prisma.article.findFirst({
    where: { slug, status: 'PUBLISHED' },
  });
  return row ? serializeArticle(row) : null;
}

/**
 * Related reading: shared tags weigh most, same category next, recency breaks ties.
 */
export async function getRelatedArticles(
  article: Pick<ArticleData, 'slug' | 'tags' | 'category'>,
  limit = 3
): Promise<ArticleSummary[]> {
  const candidates = await getPublishedArticles();
  const tags = new Set(article.tags.map((t) => t.toLowerCase()));

  return candidates
    .filter((c) => c.slug !== article.slug)
    .map((c, recency) => ({
      c,
      score:
        c.tags.filter((t) => tags.has(t.toLowerCase())).length * 3 +
        (c.category === article.category ? 2 : 0) -
        recency * 0.01,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ c }) => c);
}
