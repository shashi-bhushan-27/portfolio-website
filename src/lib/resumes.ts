import 'server-only';
import { createHash } from 'node:crypto';

/** Vercel caps request bodies at 4.5 MB; résumés are usually ~150 KB. */
export const RESUME_MAX_BYTES = 4 * 1024 * 1024;

/** The file name visitors get when they save the PDF. */
export const RESUME_DOWNLOAD_NAME = 'Shashi-Bhushan-Vijay-Resume.pdf';

/** Served by /resume when no résumé is set live in the admin. */
export const RESUME_FALLBACK = '/resume/shashi-bhushan-vijay-resume.pdf';

export const RESUME_LABEL_MAX = 120;

/** PDFs start with `%PDF-`; checking the bytes stops a renamed file of another type. */
export function isPdf(bytes: Uint8Array) {
  return (
    bytes.length > 5 &&
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 && // F
    bytes[4] === 0x2d // -
  );
}

export function sha256(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest('hex');
}

/** "resume_v7 (1).pdf" → "resume_v7 (1)" — a starting label for a new upload. */
export function labelFromFileName(name: string) {
  return name.replace(/\.pdf$/i, '').trim().slice(0, RESUME_LABEL_MAX) || 'Résumé';
}

export function pdfResponse(data: Uint8Array, hash: string, extraHeaders: Record<string, string> = {}) {
  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${RESUME_DOWNLOAD_NAME}"`,
      'Content-Length': String(data.byteLength),
      ETag: `"${hash}"`,
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}
