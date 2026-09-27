/**
 * Stateless admin session tokens: `v1.<expiresAtMs>.<hmac>`.
 *
 * Uses Web Crypto only, so the same code runs in `proxy.ts` and in server
 * actions / route handlers. The HMAC key is derived from both
 * ADMIN_SESSION_SECRET and ADMIN_PASSWORD, so rotating either one signs
 * everybody out.
 */

export const SESSION_COOKIE = 'sbv_admin';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): Uint8Array<ArrayBuffer> | null {
  try {
    const s = atob(input.replace(/-/g, '+').replace(/_/g, '/'));
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function keyMaterial() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const password = process.env.ADMIN_PASSWORD;
  if (!secret || secret.length < 32 || !password) return null;
  return `${secret}\u0000${password}`;
}

export function adminConfigured() {
  return keyMaterial() !== null;
}

async function hmacKey(material: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(material),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSessionToken(now = Date.now()) {
  const material = keyMaterial();
  if (!material) throw new Error('Admin is not configured');
  const payload = `v1.${now + SESSION_TTL_SECONDS * 1000}`;
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(material), encoder.encode(payload));
  return `${payload}.${toBase64Url(sig)}`;
}

export async function verifySessionToken(token: string | undefined | null) {
  const material = keyMaterial();
  if (!token || !material) return false;

  const [version, exp, sig] = token.split('.');
  if (version !== 'v1' || !exp || !sig) return false;

  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const signature = fromBase64Url(sig);
  if (!signature) return false;

  // crypto.subtle.verify compares in constant time.
  return crypto.subtle.verify(
    'HMAC',
    await hmacKey(material),
    signature,
    encoder.encode(`${version}.${exp}`)
  );
}
