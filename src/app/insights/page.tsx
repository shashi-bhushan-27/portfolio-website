import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { InsightsContent } from '@/components/insights/insights-content';
import type { ArticleData } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Insights — Shashi Bhushan Vijay',
  description:
    'Engineering notes, technical deep-dives, and insights on software engineering, system design, ML, and AI.',
};

export default async function InsightsPage() {
  const articles = await prisma.article.findMany({
    orderBy: { publishedAt: 'desc' },
  });

  const serialized: ArticleData[] = articles.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    content: a.content,
    category: a.category,
    readingTime: a.readingTime,
    publishedAt: a.publishedAt.toISOString(),
    tags: a.tags,
    featured: a.featured,
  }));

  // Derive categories from DB data
  const uniqueCategories = Array.from(new Set(articles.map((a) => a.category)));
  const categories = ['All', ...uniqueCategories];

  return <InsightsContent articles={serialized} categories={categories} />;
}
