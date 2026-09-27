import { prisma } from '@/lib/prisma';
import { PROJECT_ORDER } from '@/lib/projects';

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
      where: { status: 'PUBLISHED' },
      orderBy: PROJECT_ORDER,
      select: { slug: true, title: true, domain: true },
    }),
  ]);

  return Response.json({ articles, projects });
}
