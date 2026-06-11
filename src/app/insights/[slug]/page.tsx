import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ArticleContent } from '@/components/insights/article-content';
import type { ArticleData } from '@/lib/types';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const articles = await prisma.article.findMany({
    select: { slug: true },
  });
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, publishedAt: true, tags: true },
  });

  if (!article) return { title: 'Article Not Found' };

  return {
    title: `${article.title} — Shashi Bhushan Vijay`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.publishedAt.toISOString(),
      tags: article.tags,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug },
  });

  if (!article) notFound();

  const relatedArticles = await prisma.article.findMany({
    where: { slug: { not: slug } },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  });

  const serializeArticle = (a: typeof article): ArticleData => ({
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
  });

  return (
    <ArticleContent
      article={serializeArticle(article)}
      relatedArticles={relatedArticles.map(serializeArticle)}
    />
  );
}
