import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  verifySessionToken,
} from '@/lib/session';

export { adminConfigured } from '@/lib/session';

export async function isAdmin() {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

/**
 * Gate for every admin page, server action, and route handler.
 * Proxy also checks the cookie, but it is not a security boundary on its
 * own — Server Functions must authorize themselves.
 */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect('/admin/login');
}

export async function startSession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export function passwordMatches(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Hash first so both buffers have equal length for timingSafeEqual.
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/* ─── Login throttling ───
 * Best-effort, per server instance: 5 failures per 10 minutes per IP.
 * On serverless this resets on cold starts, which is why the password
 * itself must be long; this only slows down casual guessing. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map<string, { count: number; since: number }>();

export async function clientIp() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

export function loginBlocked(ip: string) {
  const entry = failures.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.since > WINDOW_MS) {
    failures.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function recordLoginFailure(ip: string) {
  const entry = failures.get(ip);
  if (!entry || Date.now() - entry.since > WINDOW_MS) {
    failures.set(ip, { count: 1, since: Date.now() });
  } else {
    entry.count++;
  }
}

export function clearLoginFailures(ip: string) {
  failures.delete(ip);
}
