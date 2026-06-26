import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { VideosContent } from '@/components/videos/videos-content';
import type { VideoData } from '@/lib/types';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Talks & Demos — Shashi Bhushan Vijay',
  description:
    'Engineering walkthroughs, system design explorations, and hands-on demonstrations by Shashi Bhushan Vijay — distributed systems, network security, and systems programming.',
  openGraph: {
    title: 'Talks & Demos — Shashi Bhushan Vijay',
    description:
      'YouTube walkthroughs covering distributed mutual exclusion, deadlock simulation, RPC mechanisms, and more.',
    url: 'https://shashibhushan.dev/videos',
  },
};

export default async function VideosPage() {
  const rawVideos = await prisma.video.findMany({
    orderBy: { order: 'asc' },
  });

  // Serialize Date → ISO string for safe Client Component hydration
  const videos: VideoData[] = rawVideos.map((v) => ({
    ...v,
    publishedAt: v.publishedAt.toISOString(),
  }));

  return <VideosContent videos={videos} />;
}
