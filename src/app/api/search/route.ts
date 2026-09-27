import { prisma } from '@/lib/prisma';

export const revalidate = 300;

/** Small, public index for the ⌘K command menu. */
export async function GET() {
  const [articles, projects] = await Promise.all([
    prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      select: { slug: true, title: true, category: true },
    }),
    prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      select: { slug: true, title: true, domain: true },
    }),
  ]);

  return Response.json({ articles, projects });
}
