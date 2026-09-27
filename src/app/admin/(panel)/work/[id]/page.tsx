import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { serializeProject } from '@/lib/projects';
import { ProjectEditor } from '@/components/admin/project-editor';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await requireAdmin();
  const { id } = await params;
  const row = await prisma.project.findUnique({ where: { id }, select: { title: true } });
  return { title: row?.title ? `Edit · ${row.title}` : 'Edit project' };
}

export default async function EditProjectPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const [row, all] = await Promise.all([
    prisma.project.findUnique({ where: { id } }),
    prisma.project.findMany({ select: { domain: true, technologies: true } }),
  ]);
  if (!row) notFound();

  const sort = (xs: Iterable<string>) =>
    [...new Set(xs)].filter(Boolean).sort((a, b) => a.localeCompare(b));

  // key: remount when switching projects so no state leaks between them.
  return (
    <ProjectEditor
      key={row.id}
      project={serializeProject(row)}
      domains={sort(all.map((p) => p.domain))}
      techSuggestions={sort(all.flatMap((p) => p.technologies))}
    />
  );
}
