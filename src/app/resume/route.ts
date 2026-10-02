import { prisma } from '@/lib/prisma';
import { RESUME_FALLBACK, pdfResponse } from '@/lib/resumes';

/*
 * The public résumé link (/resume). Serves whichever PDF is set live in the
 * admin at /admin/resumes. Cached like a static page; the admin revalidates
 * this path whenever the live résumé changes.
 */
export const revalidate = 3600;

export async function GET() {
  const live = await prisma.resume.findFirst({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    select: { data: true, sha256: true },
  });

  // Nothing uploaded yet: fall back to the PDF bundled in /public.
  if (!live) {
    return new Response(null, { status: 307, headers: { Location: RESUME_FALLBACK } });
  }
  return pdfResponse(live.data, live.sha256);
}
