import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';
import {
  RESUME_LABEL_MAX,
  RESUME_MAX_BYTES,
  isPdf,
  labelFromFileName,
  sha256,
} from '@/lib/resumes';

export const runtime = 'nodejs';

/** Upload a résumé PDF (multipart: file, label, live=1 to make it the public résumé). */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== request.headers.get('host')) {
    return Response.json({ error: 'Cross-origin upload rejected' }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) {
    return Response.json({ error: 'Choose a PDF to upload.' }, { status: 400 });
  }
  if (file.size > RESUME_MAX_BYTES) {
    return Response.json({ error: 'PDFs must be 4 MB or smaller.' }, { status: 413 });
  }

  const data = new Uint8Array(await file.arrayBuffer());
  if (!isPdf(data)) {
    return Response.json({ error: 'That file isn’t a PDF.' }, { status: 415 });
  }

  const label = String(form?.get('label') ?? '').trim() || labelFromFileName(file.name);
  if (label.length > RESUME_LABEL_MAX) {
    return Response.json({ error: 'The label is too long.' }, { status: 400 });
  }
  const live = form?.get('live') === '1';

  try {
    const ops: Prisma.PrismaPromise<unknown>[] = [];
    // Only one résumé is live at a time.
    if (live) ops.push(prisma.resume.updateMany({ where: { active: true }, data: { active: false } }));
    ops.push(
      prisma.resume.create({
        data: {
          label,
          fileName: file.name.slice(0, 200),
          size: data.byteLength,
          sha256: sha256(data),
          data,
          active: live,
        },
        select: { id: true },
      })
    );
    await prisma.$transaction(ops);
  } catch (e) {
    console.error('[admin] résumé upload failed', e);
    return Response.json({ error: 'Upload failed. Try again.' }, { status: 500 });
  }

  revalidatePath('/admin/resumes');
  if (live) revalidatePath('/resume');
  return Response.json({ ok: true });
}
