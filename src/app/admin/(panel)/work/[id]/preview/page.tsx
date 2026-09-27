import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { serializeProject } from '@/lib/projects';
import { CaseStudyContent } from '@/components/work/case-study-content';

export const metadata: Metadata = { title: 'Preview' };

type Props = { params: Promise<{ id: string }> };

/** The case study exactly as the public page renders it — including drafts. */
export default async function PreviewProjectPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const row = await prisma.project.findUnique({ where: { id } });
  if (!row) notFound();
  const project = serializeProject(row);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[60] flex h-10 items-center gap-3 border-b border-warn/30 bg-bg/90 px-4 backdrop-blur">
        <span className="size-1.5 bg-warn" />
        <span className="label-mono text-fg">
          Preview · {project.status === 'PUBLISHED' ? 'live version' : 'draft, not public'}
        </span>
        <Link href={`/admin/work/${id}`} className="label-mono ml-auto text-fg-muted link-underline hover:text-fg">
          Back to editor
        </Link>
      </div>
      <CaseStudyContent project={project} next={null} />
      <div className="h-24" />
    </>
  );
}
