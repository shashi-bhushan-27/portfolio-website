import type { Metadata } from 'next';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { PROJECT_ORDER } from '@/lib/projects';
import { AdminHeader } from '@/components/admin/admin-header';
import { ProjectManager } from '@/components/admin/project-manager';
import { buttonStyles } from '@/components/ui/button';
import { createProjectDraft } from '@/app/admin/project-actions';
import type { AdminProject } from '@/lib/types';

export const metadata: Metadata = { title: 'Work' };

export default async function AdminWorkPage() {
  await requireAdmin();

  const rows = await prisma.project.findMany({
    orderBy: PROJECT_ORDER,
    select: {
      id: true,
      slug: true,
      title: true,
      domain: true,
      year: true,
      featured: true,
      status: true,
      order: true,
      updatedAt: true,
    },
  });
  const projects: AdminProject[] = rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }));

  return (
    <>
      <AdminHeader current="work" />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-medium tracking-[-0.03em]">Work</h1>
            <p className="mt-1.5 text-sm text-fg-muted">
              Case studies shown on /work. Drafts stay private until you publish them.
            </p>
          </div>
          <form action={createProjectDraft}>
            <button type="submit" className={buttonStyles({ variant: 'primary' })}>
              <Plus className="size-4" />
              New project
            </button>
          </form>
        </div>
        <div className="mt-10">
          <ProjectManager projects={projects} />
        </div>
      </main>
    </>
  );
}
