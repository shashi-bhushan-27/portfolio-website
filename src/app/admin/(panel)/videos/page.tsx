import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { AdminHeader } from '@/components/admin/admin-header';
import { VideoManager } from '@/components/admin/video-manager';
import type { AdminVideo } from '@/lib/types';

export const metadata: Metadata = { title: 'Videos' };

export default async function AdminVideosPage() {
  await requireAdmin();

  const rows = await prisma.video.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
  const videos: AdminVideo[] = rows.map(({ id, youtubeId, title, description, category, featured, order }) => ({
    id,
    youtubeId,
    title,
    description,
    category,
    featured,
    order,
  }));
  const categories = [...new Set(rows.map((r) => r.category).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );

  return (
    <>
      <AdminHeader current="videos" />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-3xl font-medium tracking-[-0.03em]">Videos</h1>
          <p className="mt-1.5 text-sm text-fg-muted">
            Changes go live on the Videos page immediately. The starred video gets the big player at
            the top.
          </p>
        </div>
        <div className="mt-8">
          <VideoManager videos={videos} categories={categories} />
        </div>
      </main>
    </>
  );
}
