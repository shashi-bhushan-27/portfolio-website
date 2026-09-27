import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { isAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024 * 1024;
// SVG is deliberately excluded: it can carry script.
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']);

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== request.headers.get('host')) {
    return Response.json({ error: 'Cross-origin upload rejected' }, { status: 403 });
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return Response.json({ error: 'Image uploads are not configured (Cloudinary env vars missing).' }, { status: 503 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) {
    return Response.json({ error: 'No file received.' }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return Response.json({ error: 'Use PNG, JPEG, WebP, GIF or AVIF.' }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: 'Images must be 8 MB or smaller.' }, { status: 413 });
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: 'portfolio/blog', resource_type: 'image', unique_filename: true, overwrite: false },
          (error, res) => (error || !res ? reject(error) : resolve(res))
        )
        .end(buffer);
    });

    return Response.json({
      url: result.secure_url,
      width: result.width,
      height: result.height,
    });
  } catch (e) {
    console.error('[admin] upload failed', e);
    return Response.json({ error: 'Upload failed. Try again.' }, { status: 502 });
  }
}
