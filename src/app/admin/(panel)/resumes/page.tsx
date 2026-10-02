import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { AdminHeader } from '@/components/admin/admin-header';
import { ResumeManager } from '@/components/admin/resume-manager';
import { RESUME_FALLBACK } from '@/lib/resumes';
import type { AdminResume } from '@/lib/types';

export const metadata: Metadata = { title: 'Résumés' };

export default async function AdminResumesPage() {
  await requireAdmin();

  const rows = await prisma.resume.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, label: true, fileName: true, size: true, active: true, createdAt: true },
  });
  const resumes: AdminResume[] = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));

  return (
    <>
      <AdminHeader current="resumes" />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-3xl font-medium tracking-[-0.03em]">Résumés</h1>
          <p className="mt-1.5 text-sm text-fg-muted">
            Keep every version here. The one marked live is what visitors download from{' '}
            <a href="/resume" target="_blank" className="font-mono text-[13px] text-fg link-underline">
              /resume
            </a>{' '}
            — the Résumé buttons, the ⌘K menu and the assistant all point there.
          </p>
        </div>
        <div className="mt-8">
          <ResumeManager resumes={resumes} fallback={RESUME_FALLBACK} />
        </div>
      </main>
    </>
  );
}
