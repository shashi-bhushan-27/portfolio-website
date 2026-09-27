import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getPublishedArticle, getRelatedArticles } from '@/lib/articles';
import { ArticleView } from '@/components/insights/article-view';
import { siteConfig } from '@/lib/constants';

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true },
  });
  return articles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) return { title: 'Article not found' };

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/insights/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [siteConfig.name],
      tags: article.tags,
      ...(article.coverImage ? { images: [{ url: article.coverImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      ...(article.coverImage ? { images: [article.coverImage] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) notFound();

  const related = await getRelatedArticles(article);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    keywords: article.tags.join(', '),
    author: { '@type': 'Person', name: siteConfig.name, url: siteConfig.url },
    mainEntityOfPage: `${siteConfig.url}/insights/${article.slug}`,
    ...(article.coverImage ? { image: article.coverImage } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ArticleView article={article} related={related} />
    </>
  );
}
