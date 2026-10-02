'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { KNOWLEDGE_TAG } from '@/lib/assistant/knowledge';
import { serializeProject } from '@/lib/projects';
import { SLUG_PATTERN } from '@/lib/markdown';
import { PROJECT_SECTIONS, type ProjectSectionKey } from '@/lib/project-sections';
import type { ProjectData, PublishStatus } from '@/lib/types';

export type MetricRow = { key: string; value: string };

export type ProjectInput = {
  title: string;
  slug: string;
  excerpt: string;
  domain: string;
  year: string;
  technologies: string[];
  featured: boolean;
  githubUrl: string;
  liveUrl: string;
  metrics: MetricRow[];
} & Record<ProjectSectionKey, string>;

export type ProjectSaveResult =
  | { ok: true; project: ProjectData }
  | { ok: false; error: string; field?: keyof ProjectInput; conflict?: boolean };

export type ProjectListResult = { ok: true } | { ok: false; error: string };

const LIMITS = {
  title: 200,
  slug: 120,
  excerpt: 500,
  domain: 60,
  year: 20,
  tech: 40,
  techCount: 30,
  metricKey: 40,
  metricValue: 80,
  metricCount: 8,
  url: 300,
  section: 20_000,
};

type Clean = Omit<ProjectInput, 'metrics' | 'githubUrl' | 'liveUrl'> & {
  metrics: Record<string, string>;
  githubUrl: string | null;
  liveUrl: string | null;
};

function cleanUrl(raw: string, field: 'githubUrl' | 'liveUrl') {
  const value = raw.trim();
  if (!value) return { ok: true as const, value: null };
  let ok = value.length <= LIMITS.url && /^https?:\/\//i.test(value);
  try {
    new URL(value);
  } catch {
    ok = false;
  }
  return ok
    ? { ok: true as const, value }
    : { ok: false as const, field, error: 'Links must be full URLs starting with https://' };
}

/**
 * Drafts only need to be storable; publishing also needs the fields every
 * listing shows (title, one-line summary, domain).
 */
function validate(
  input: ProjectInput,
  status: PublishStatus
): { ok: true; data: Clean } | { ok: false; error: string; field: keyof ProjectInput } {
  const publishing = status === 'PUBLISHED';
  const title = input.title.trim();
  const slug = input.slug.trim();
  const excerpt = input.excerpt.trim();
  const domain = input.domain.trim();
  const year = input.year.trim();

  if (publishing && !title) return { ok: false, field: 'title', error: 'Add a title before publishing.' };
  if (title.length > LIMITS.title) return { ok: false, field: 'title', error: 'Title is too long.' };
  if (!SLUG_PATTERN.test(slug) || slug.length > LIMITS.slug)
    return { ok: false, field: 'slug', error: 'The URL may only contain lowercase letters, numbers and single hyphens.' };
  if (publishing && !excerpt) return { ok: false, field: 'excerpt', error: 'Add a one-line summary before publishing.' };
  if (excerpt.length > LIMITS.excerpt) return { ok: false, field: 'excerpt', error: `Summary must be under ${LIMITS.excerpt} characters.` };
  if (publishing && !domain) return { ok: false, field: 'domain', error: 'Add a domain before publishing (it’s used for the filters on /work).' };
  if (domain.length > LIMITS.domain) return { ok: false, field: 'domain', error: 'Domain is too long.' };
  if (year.length > LIMITS.year) return { ok: false, field: 'year', error: 'Year is too long.' };

  const technologies = [...new Set(input.technologies.map((t) => t.trim()).filter(Boolean))];
  if (technologies.length > LIMITS.techCount) return { ok: false, field: 'technologies', error: `Use at most ${LIMITS.techCount} technologies.` };
  if (technologies.some((t) => t.length > LIMITS.tech)) return { ok: false, field: 'technologies', error: 'A technology name is too long.' };

  const rows = input.metrics
    .map((m) => ({ key: m.key.trim(), value: m.value.trim() }))
    .filter((m) => m.key || m.value);
  if (rows.length > LIMITS.metricCount) return { ok: false, field: 'metrics', error: `Use at most ${LIMITS.metricCount} metrics.` };
  for (const m of rows) {
    if (!m.key) return { ok: false, field: 'metrics', error: `The metric “${m.value}” needs a name.` };
    if (!m.value) return { ok: false, field: 'metrics', error: `The metric “${m.key}” needs a value.` };
    if (m.key.length > LIMITS.metricKey || m.value.length > LIMITS.metricValue)
      return { ok: false, field: 'metrics', error: 'A metric name or value is too long.' };
  }
  const metrics = Object.fromEntries(rows.map((m) => [m.key, m.value]));
  if (Object.keys(metrics).length !== rows.length)
    return { ok: false, field: 'metrics', error: 'Two metrics have the same name.' };

  const github = cleanUrl(input.githubUrl, 'githubUrl');
  if (!github.ok) return github;
  const live = cleanUrl(input.liveUrl, 'liveUrl');
  if (!live.ok) return live;

  const sections = {} as Record<ProjectSectionKey, string>;
  for (const { key, label } of PROJECT_SECTIONS) {
    const body = (input[key] ?? '').replace(/\r\n/g, '\n');
    if (body.length > LIMITS.section) return { ok: false, field: key, error: `“${label}” is too long.` };
    sections[key] = body;
  }

  return {
    ok: true,
    data: {
      title,
      slug,
      excerpt,
      domain,
      year,
      technologies,
      featured: !!input.featured,
      metrics,
      githubUrl: github.value,
      liveUrl: live.value,
      ...sections,
    },
  };
}

/**
 * Re-render every public page that lists or shows projects. All case study
 * pages are included because their "Next project" link depends on the order
 * and on which projects are published.
 */
function revalidatePublic(...slugs: (string | undefined)[]) {
  revalidatePath('/');
  revalidatePath('/work');
  revalidatePath('/(site)/work/[slug]', 'page');
  for (const slug of new Set(slugs.filter(Boolean))) revalidatePath(`/work/${slug}`);
  revalidatePath('/sitemap.xml');
  revalidatePath('/api/search');
  updateTag(KNOWLEDGE_TAG);
}

function failure(e: unknown, action: string): { ok: false; error: string; field?: keyof ProjectInput } {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    return { ok: false, field: 'slug', error: 'Another project already uses this URL.' };
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
    return { ok: false, error: 'This project no longer exists.' };
  }
  console.error(`[admin] project ${action} failed`, e);
  return { ok: false, error: `Could not ${action} the project. Check the server logs.` };
}

/**
 * "New project": open the editor on a stored draft straight away (so the
 * editor never changes URL mid-session). A blank draft is reused if one exists.
 */
export async function createProjectDraft() {
  await requireAdmin();
  const blank = await prisma.project.findFirst({
    where: { status: 'DRAFT', title: '', excerpt: '', executiveSummary: '' },
    select: { id: true },
  });
  let id = blank?.id;
  if (!id) {
    const first = await prisma.project.findFirst({ orderBy: { order: 'asc' }, select: { order: true } });
    const empty = Object.fromEntries(PROJECT_SECTIONS.map((s) => [s.key, ''])) as Record<ProjectSectionKey, string>;
    const row = await prisma.project.create({
      data: {
        slug: `untitled-${randomBytes(3).toString('hex')}`,
        title: '',
        excerpt: '',
        domain: '',
        year: String(new Date().getFullYear()),
        technologies: [],
        metrics: {},
        coverGradient: '',
        icon: '',
        status: 'DRAFT',
        // New work goes to the top of the list.
        order: (first?.order ?? 1) - 1,
        ...empty,
      },
      select: { id: true },
    });
    id = row.id;
  }
  revalidatePath('/admin/work');
  redirect(`/admin/work/${id}`);
}

export async function updateProject(
  id: string,
  input: ProjectInput,
  opts: { status?: PublishStatus; expectedUpdatedAt?: string } = {}
): Promise<ProjectSaveResult> {
  await requireAdmin();

  const current = await prisma.project.findUnique({ where: { id } });
  if (!current) return { ok: false, error: 'This project no longer exists.' };

  const status = opts.status ?? current.status;
  const v = validate(input, status);
  if (!v.ok) return v;

  if (opts.expectedUpdatedAt && current.updatedAt.toISOString() !== opts.expectedUpdatedAt) {
    return { ok: false, conflict: true, error: 'This project was changed somewhere else since you opened it.' };
  }

  try {
    const row = await prisma.project.update({ where: { id }, data: { ...v.data, status } });
    if (current.status === 'PUBLISHED' || status === 'PUBLISHED') revalidatePublic(current.slug, row.slug);
    return { ok: true, project: serializeProject(row) };
  } catch (e) {
    return failure(e, 'save');
  }
}

export async function deleteProject(id: string): Promise<ProjectListResult> {
  await requireAdmin();
  try {
    const row = await prisma.project.delete({ where: { id } });
    if (row.status === 'PUBLISHED') revalidatePublic(row.slug);
  } catch (e) {
    return failure(e, 'delete');
  }
  revalidatePath('/admin/work');
  return { ok: true };
}

/** Toggle "Selected work" on the home page. */
export async function setProjectFeatured(id: string, featured: boolean): Promise<ProjectListResult> {
  await requireAdmin();
  try {
    const row = await prisma.project.update({ where: { id }, data: { featured } });
    if (row.status === 'PUBLISHED') revalidatePublic(row.slug);
  } catch (e) {
    return failure(e, 'update');
  }
  revalidatePath('/admin/work');
  return { ok: true };
}

/** Persist a new order. Unknown ids are ignored; projects missing from the list keep their relative order at the end. */
export async function reorderProjects(ids: string[]): Promise<ProjectListResult> {
  await requireAdmin();
  if (!Array.isArray(ids) || ids.length > 1000) return { ok: false, error: 'Invalid order.' };
  try {
    const existing = await prisma.project.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      select: { id: true },
    });
    const known = new Set(existing.map((p) => p.id));
    const ordered = [...new Set(ids.filter((id) => typeof id === 'string' && known.has(id)))];
    for (const p of existing) if (!ordered.includes(p.id)) ordered.push(p.id);
    // Raw SQL so reordering doesn't bump updatedAt: it isn't an edit, and a bumped
    // timestamp would make an editor open in another tab report a false conflict.
    await prisma.$transaction(
      ordered.map((id, i) => prisma.$executeRaw`UPDATE "Project" SET "order" = ${i + 1} WHERE "id" = ${id}`)
    );
  } catch (e) {
    return failure(e, 'reorder');
  }
  revalidatePublic();
  revalidatePath('/admin/work');
  return { ok: true };
}
