import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';
import { pdfResponse } from '@/lib/resumes';

export const runtime = 'nodejs';

/** Admin-only preview of any uploaded résumé, live or not. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const resume = await prisma.resume.findUnique({
    where: { id },
    select: { data: true, sha256: true },
  });
  if (!resume) return Response.json({ error: 'Not found' }, { status: 404 });

  return pdfResponse(resume.data, resume.sha256, {
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex',
  });
}
