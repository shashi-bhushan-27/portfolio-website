'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { parseYouTubeId } from '@/lib/youtube';

export type VideoInput = {
  /** A YouTube link in any common form, or a bare 11-character ID. */
  url: string;
  title: string;
  description: string;
  category: string;
  /** Omit to leave the current value unchanged (updates only). */
  featured?: boolean;
};

export type VideoResult = { ok: true } | { ok: false; error: string; field?: keyof VideoInput };

export type LookupResult =
  | { ok: true; id: string; title: string; author: string }
  | { ok: false; error: string };

const LIMITS = { title: 200, description: 1000, category: 60 };

function validate(input: VideoInput):
  | { ok: true; data: { youtubeId: string; title: string; description: string; category: string } }
  | { ok: false; error: string; field: keyof VideoInput } {
  const youtubeId = parseYouTubeId(input.url);
  const title = input.title.trim();
  const description = input.description.trim();
  const category = input.category.trim();

  if (!youtubeId) return { ok: false, field: 'url', error: 'That isn’t a YouTube link or video ID.' };
  if (!title) return { ok: false, field: 'title', error: 'Add a title.' };
  if (title.length > LIMITS.title) return { ok: false, field: 'title', error: 'Title is too long.' };
  if (description.length > LIMITS.description)
    return { ok: false, field: 'description', error: `Description must be under ${LIMITS.description} characters.` };
  if (!category) return { ok: false, field: 'category', error: 'Add a category.' };
  if (category.length > LIMITS.category) return { ok: false, field: 'category', error: 'Category is too long.' };

  return { ok: true, data: { youtubeId, title, description, category } };
}

/** Refresh the public gallery and this admin screen in the same round trip. */
function refresh() {
  revalidatePath('/videos');
  revalidatePath('/admin/videos');
}

function failure(e: unknown, action: string): VideoResult {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    return { ok: false, field: 'url', error: 'This video is already on the site.' };
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
    return { ok: false, error: 'This video no longer exists.' };
  }
  console.error(`[admin] video ${action} failed`, e);
  return { ok: false, error: `Could not ${action} the video. Check the server logs.` };
}

/** Fetch a video's public title from YouTube's oEmbed endpoint (no API key needed). */
export async function lookupYouTube(url: string): Promise<LookupResult> {
  await requireAdmin();
  const id = parseYouTubeId(url);
  if (!id) return { ok: false, error: 'That isn’t a YouTube link or video ID.' };

  try {
    const watch = `https://www.youtube.com/watch?v=${id}`;
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watch)}`, {
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    if (!res.ok) {
      return { ok: false, error: 'YouTube has no public video with this ID (private or removed?).' };
    }
    const data = (await res.json()) as { title?: string; author_name?: string };
    return { ok: true, id, title: data.title?.trim() ?? '', author: data.author_name ?? '' };
  } catch {
    return { ok: false, error: 'Couldn’t reach YouTube to fetch the title — type it in instead.' };
  }
}

export async function addVideo(input: VideoInput): Promise<VideoResult> {
  await requireAdmin();
  const v = validate(input);
  if (!v.ok) return v;

  try {
    // New videos go to the top of the gallery.
    const first = await prisma.video.findFirst({ orderBy: { order: 'asc' }, select: { order: true } });
    const ops: Prisma.PrismaPromise<unknown>[] = [];
    // Only one video is featured: it takes the large player at the top of /videos.
    if (input.featured) {
      ops.push(prisma.video.updateMany({ where: { featured: true }, data: { featured: false } }));
    }
    ops.push(
      prisma.video.create({
        data: { ...v.data, featured: !!input.featured, order: (first?.order ?? 1) - 1 },
      })
    );
    await prisma.$transaction(ops);
  } catch (e) {
    return failure(e, 'add');
  }
  refresh();
  return { ok: true };
}

export async function updateVideo(id: string, input: VideoInput): Promise<VideoResult> {
  await requireAdmin();
  const v = validate(input);
  if (!v.ok) return v;

  try {
    const ops: Prisma.PrismaPromise<unknown>[] = [];
    if (input.featured) {
      ops.push(prisma.video.updateMany({ where: { featured: true, NOT: { id } }, data: { featured: false } }));
    }
    ops.push(
      prisma.video.update({
        where: { id },
        data: { ...v.data, ...(input.featured === undefined ? {} : { featured: input.featured }) },
      })
    );
    await prisma.$transaction(ops);
  } catch (e) {
    return failure(e, 'save');
  }
  refresh();
  return { ok: true };
}

/** Make `id` the featured (large) video, or clear the feature with null. */
export async function setFeaturedVideo(id: string | null): Promise<VideoResult> {
  await requireAdmin();
  try {
    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.video.updateMany({ where: { featured: true }, data: { featured: false } }),
    ];
    if (id) ops.push(prisma.video.update({ where: { id }, data: { featured: true } }));
    await prisma.$transaction(ops);
  } catch (e) {
    return failure(e, 'feature');
  }
  refresh();
  return { ok: true };
}

/** Persist a new gallery order. Unknown ids are ignored; videos missing from the list keep their relative order at the end. */
export async function reorderVideos(ids: string[]): Promise<VideoResult> {
  await requireAdmin();
  if (!Array.isArray(ids) || ids.length > 1000) return { ok: false, error: 'Invalid order.' };

  try {
    const existing = await prisma.video.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      select: { id: true },
    });
    const known = new Set(existing.map((v) => v.id));
    const ordered = [...new Set(ids.filter((id) => typeof id === 'string' && known.has(id)))];
    for (const v of existing) if (!ordered.includes(v.id)) ordered.push(v.id);

    await prisma.$transaction(
      ordered.map((id, i) => prisma.video.update({ where: { id }, data: { order: i + 1 } }))
    );
  } catch (e) {
    return failure(e, 'reorder');
  }
  refresh();
  return { ok: true };
}

export async function deleteVideo(id: string): Promise<VideoResult> {
  await requireAdmin();
  try {
    await prisma.video.delete({ where: { id } });
  } catch (e) {
    return failure(e, 'delete');
  }
  refresh();
  return { ok: true };
}
