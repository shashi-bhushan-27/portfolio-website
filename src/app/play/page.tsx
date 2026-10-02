import type { Metadata, Viewport } from 'next';
import { prisma } from '@/lib/prisma';
import { GameLoader } from '@/game/game-loader';

export const metadata: Metadata = {
  title: { absolute: 'Shashi.EXE — Interactive Portfolio' },
  description: 'Explore an interactive developer portfolio built by Shashi.',
  alternates: { canonical: '/play' },
};

export const viewport: Viewport = {
  themeColor: '#0d0f12',
};

export const revalidate = 60;

/** Case studies that are live, so the game only links to pages that exist. */
async function publishedSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.project.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true } });
    return rows.map((r) => r.slug);
  } catch {
    // The game works without links; never fail the page over them.
    return [];
  }
}

export default async function PlayPage() {
  return <GameLoader publishedSlugs={await publishedSlugs()} />;
}
