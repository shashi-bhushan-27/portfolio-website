'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  adminConfigured,
  clearLoginFailures,
  clientIp,
  endSession,
  loginBlocked,
  passwordMatches,
  recordLoginFailure,
  requireAdmin,
  startSession,
} from '@/lib/auth';
import { serializeArticle } from '@/lib/articles';
import { SLUG_PATTERN, readingTime, suggestExcerpt } from '@/lib/markdown';
import type { ArticleData, ArticleStatus } from '@/lib/types';

/* ─────────────────────────── Auth ─────────────────────────── */

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!adminConfigured()) {
    return { error: 'Admin is not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET.' };
  }

  const ip = await clientIp();
  if (loginBlocked(ip)) {
    return { error: 'Too many attempts. Try again in a few minutes.' };
  }

  const password = String(formData.get('password') ?? '');
  if (!passwordMatches(password)) {
    recordLoginFailure(ip);
    await new Promise((r) => setTimeout(r, 600));
    return { error: 'Incorrect password.' };
  }

  clearLoginFailures(ip);
  await startSession();
  const next = String(formData.get('next') ?? '');
  redirect(next.startsWith('/admin') ? next : '/admin');
}

export async function logout() {
  await endSession();
  redirect('/admin/login');
}

/* ─────────────────────────── Articles ─────────────────────────── */

export type ArticleInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featured: boolean;
  publishedAt: string; // ISO
  coverImage: string | null;
};

export type SaveResult =
  | { ok: true; article: ArticleData }
  | { ok: false; error: string; field?: keyof ArticleInput; conflict?: boolean };

const LIMITS = { title: 200, slug: 120, excerpt: 400, category: 60, tag: 40, tags: 12, content: 200_000 };

type Clean = Omit<ArticleInput, 'publishedAt'> & { publishedAt: Date };

/**
 * Drafts only need to be storable (valid slug, sane sizes); publishing also
 * needs a title and category. An empty excerpt is filled from the body.
 */
function validate(
  input: ArticleInput,
  status: ArticleStatus
): { ok: true; data: Clean } | { ok: false; error: string; field: keyof ArticleInput } {
  const title = input.title.trim();
  const slug = input.slug.trim();
  const category = input.category.trim();
  const content = input.content.replace(/\r\n/g, '\n');
  let excerpt = input.excerpt.trim();
  const tags = [...new Set(input.tags.map((t) => t.trim()).filter(Boolean))];
  const coverImage = input.coverImage?.trim() || null;
  const publishedAt = new Date(input.publishedAt);
  const publishing = status === 'PUBLISHED';

  if (publishing && !title) return { ok: false, field: 'title', error: 'Add a title before publishing.' };
  if (title.length > LIMITS.title) return { ok: false, field: 'title', error: 'Title is too long.' };
  if (!SLUG_PATTERN.test(slug) || slug.length > LIMITS.slug)
    return { ok: false, field: 'slug', error: 'The URL may only contain lowercase letters, numbers and single hyphens.' };
  if (publishing && !category) return { ok: false, field: 'category', error: 'Add a category before publishing.' };
  if (category.length > LIMITS.category) return { ok: false, field: 'category', error: 'Category is too long.' };
  if (publishing && !excerpt) excerpt = suggestExcerpt(content);
  if (excerpt.length > LIMITS.excerpt) return { ok: false, field: 'excerpt', error: `Excerpt must be under ${LIMITS.excerpt} characters.` };
  if (tags.length > LIMITS.tags) return { ok: false, field: 'tags', error: `Use at most ${LIMITS.tags} tags.` };
  if (tags.some((t) => t.length > LIMITS.tag)) return { ok: false, field: 'tags', error: 'A tag is too long.' };
  if (content.length > LIMITS.content) return { ok: false, field: 'content', error: 'Article body is too long.' };
  if (Number.isNaN(publishedAt.getTime())) return { ok: false, field: 'publishedAt', error: 'Publish date is invalid.' };
  if (coverImage && !/^https:\/\//.test(coverImage)) return { ok: false, field: 'coverImage', error: 'Cover image must be an https URL.' };

  return {
    ok: true,
    data: { title, slug, excerpt, content, category, tags, featured: !!input.featured, publishedAt, coverImage },
  };
}

/** Push changes to the live site: re-render every public page that lists or shows articles. */
function revalidatePublic(...slugs: (string | undefined)[]) {
  revalidatePath('/');
  revalidatePath('/insights');
  for (const slug of new Set(slugs.filter(Boolean))) revalidatePath(`/insights/${slug}`);
  revalidatePath('/feed.xml');
  revalidatePath('/sitemap.xml');
  revalidatePath('/api/search');
}

function friendlyError(e: unknown): SaveResult {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    return { ok: false, field: 'slug', error: 'Another article already uses this URL.' };
  }
  console.error('[admin] article save failed', e);
  return { ok: false, error: 'Could not save. Check the server logs.' };
}

/**
 * "New article": open the editor on a stored draft straight away, so the
 * editor never has to change its URL mid-session. An existing blank draft is
 * reused, so abandoned "new article" clicks don't pile up.
 */
export async function createDraft() {
  await requireAdmin();
  const blank = await prisma.article.findFirst({
    where: { status: 'DRAFT', title: '', OR: [{ content: null }, { content: '' }] },
    select: { id: true },
  });
  const id =
    blank?.id ??
    (
      await prisma.article.create({
        data: {
          slug: `untitled-${randomBytes(3).toString('hex')}`,
          title: '',
          excerpt: '',
          content: '',
          category: '',
          readingTime: 1,
          publishedAt: new Date(),
          tags: [],
          status: 'DRAFT',
        },
        select: { id: true },
      })
    ).id;
  redirect(`/admin/articles/${id}`);
}

export async function updateArticle(
  id: string,
  input: ArticleInput,
  opts: { status?: ArticleStatus; expectedUpdatedAt?: string } = {}
): Promise<SaveResult> {
  await requireAdmin();

  const current = await prisma.article.findUnique({ where: { id } });
  if (!current) return { ok: false, error: 'This article no longer exists.' };

  const status = opts.status ?? current.status;
  const v = validate(input, status);
  if (!v.ok) return v;

  if (opts.expectedUpdatedAt && current.updatedAt.toISOString() !== opts.expectedUpdatedAt) {
    return {
      ok: false,
      conflict: true,
      error: 'This article was changed somewhere else since you opened it.',
    };
  }

  try {
    const row = await prisma.article.update({
      where: { id },
      data: { ...v.data, status, readingTime: readingTime(v.data.content) },
    });
    // Anything that was or now is public needs fresh pages; the old slug too if it changed.
    if (current.status === 'PUBLISHED' || status === 'PUBLISHED') {
      revalidatePublic(current.slug, row.slug);
    }
    return { ok: true, article: serializeArticle(row) };
  } catch (e) {
    return friendlyError(e);
  }
}

export async function deleteArticle(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  try {
    const row = await prisma.article.delete({ where: { id } });
    if (row.status === 'PUBLISHED') revalidatePublic(row.slug);
    return { ok: true };
  } catch (e) {
    console.error('[admin] delete failed', e);
    return { ok: false, error: 'Could not delete this article.' };
  }
}

export async function setArticleFlags(
  id: string,
  flags: { featured?: boolean; status?: ArticleStatus }
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  try {
    const before = await prisma.article.findUnique({ where: { id }, select: { status: true } });
    const row = await prisma.article.update({ where: { id }, data: flags });
    if (before?.status === 'PUBLISHED' || row.status === 'PUBLISHED') revalidatePublic(row.slug);
    return { ok: true };
  } catch (e) {
    console.error('[admin] flag update failed', e);
    return { ok: false, error: 'Could not update this article.' };
  }
}
