'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { RESUME_LABEL_MAX } from '@/lib/resumes';

export type ResumeResult = { ok: true } | { ok: false; error: string };

/** The public /resume link and this admin screen. */
function refresh() {
  revalidatePath('/resume');
  revalidatePath('/admin/resumes');
}

function failure(e: unknown, action: string): ResumeResult {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
    return { ok: false, error: 'This résumé no longer exists.' };
  }
  console.error(`[admin] résumé ${action} failed`, e);
  return { ok: false, error: `Could not ${action} the résumé. Check the server logs.` };
}

/** Make `id` the résumé visitors download at /resume, or pass null to fall back to the bundled PDF. */
export async function setLiveResume(id: string | null): Promise<ResumeResult> {
  await requireAdmin();
  try {
    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.resume.updateMany({ where: { active: true }, data: { active: false } }),
    ];
    if (id) ops.push(prisma.resume.update({ where: { id }, data: { active: true }, select: { id: true } }));
    await prisma.$transaction(ops);
  } catch (e) {
    return failure(e, 'update');
  }
  refresh();
  return { ok: true };
}

export async function renameResume(id: string, label: string): Promise<ResumeResult> {
  await requireAdmin();
  const clean = label.trim();
  if (!clean) return { ok: false, error: 'Add a label.' };
  if (clean.length > RESUME_LABEL_MAX) return { ok: false, error: 'The label is too long.' };
  try {
    await prisma.resume.update({ where: { id }, data: { label: clean }, select: { id: true } });
  } catch (e) {
    return failure(e, 'rename');
  }
  revalidatePath('/admin/resumes');
  return { ok: true };
}

export async function deleteResume(id: string): Promise<ResumeResult> {
  await requireAdmin();
  try {
    await prisma.resume.delete({ where: { id }, select: { id: true } });
  } catch (e) {
    return failure(e, 'delete');
  }
  refresh();
  return { ok: true };
}
