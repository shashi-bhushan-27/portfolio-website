import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { siteConfig } from '@/lib/constants';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const [articles, projects] = await Promise.all([
    prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }),
    prisma.project.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    ...siteConfig.navigation.map((n) => ({
      url: `${base}${n.href}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...articles.map((a) => ({
      url: `${base}/insights/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...projects.map((p) => ({
      url: `${base}/work/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
