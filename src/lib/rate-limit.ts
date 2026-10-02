import 'server-only';
import { createHash } from 'node:crypto';
import { after } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Fixed-window rate limiting backed by Postgres (the `RateLimit` table), so
 * limits hold across serverless instances and cold starts — unlike the
 * in-memory login throttle in lib/auth.ts.
 */

export type Limit = {
  /** Short name, part of the row key and returned when the limit trips. */
  name: string;
  limit: number;
  windowSec: number;
  /** `client` counts per IP (the default); `global` counts every request together. */
  scope?: 'client' | 'global';
};

export type RateLimitResult = { ok: true } | { ok: false; name: string; retryAfter: number };

/** Client IP as Vercel reports it (the first `x-forwarded-for` hop is set by the edge). */
export function clientIpFrom(headers: Headers) {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
}

/** IPs are hashed before they are stored. */
function hashId(value: string) {
  return createHash('sha256').update(value).digest('base64url').slice(0, 22);
}

async function hit(bucket: string, id: string, l: Limit, now: number) {
  const windowMs = l.windowSec * 1000;
  const start = Math.floor(now / windowMs) * windowMs;
  const key = `${bucket}:${l.name}:${l.scope === 'global' ? 'global' : id}:${start}`;
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "expiresAt")
    VALUES (${key}, 1, ${new Date(start + windowMs)})
    ON CONFLICT ("key") DO UPDATE SET "count" = "RateLimit"."count" + 1
    RETURNING "count"`;
  return {
    over: Number(rows[0]?.count ?? 0) > l.limit,
    retryAfter: Math.max(1, Math.ceil((start + windowMs - now) / 1000)),
  };
}

/**
 * Count one request against `limits`. Per-client limits are checked first and
 * global ones only when those pass, so one noisy client can't use up a shared
 * budget. Fails open (allows the request) if the database is unreachable.
 */
export async function rateLimit(
  bucket: string,
  identifier: string,
  limits: Limit[]
): Promise<RateLimitResult> {
  const now = Date.now();
  const id = hashId(identifier);

  try {
    for (const group of [
      limits.filter((l) => l.scope !== 'global'),
      limits.filter((l) => l.scope === 'global'),
    ]) {
      const results = await Promise.all(group.map((l) => hit(bucket, id, l, now)));
      const tripped = results.findIndex((r) => r.over);
      if (tripped !== -1) {
        return { ok: false, name: group[tripped].name, retryAfter: results[tripped].retryAfter };
      }
    }
  } catch (e) {
    console.error('[rate-limit] check failed; allowing request', e);
    return { ok: true };
  }

  // Occasionally clear out expired windows, after the response has been sent.
  if (Math.random() < 0.02) {
    after(() =>
      prisma.rateLimit
        .deleteMany({ where: { expiresAt: { lt: new Date() } } })
        .catch((e) => console.error('[rate-limit] prune failed', e))
    );
  }
  return { ok: true };
}

export function tooManyRequests(retryAfter: number, message: string) {
  return new Response(message, {
    status: 429,
    headers: { 'Retry-After': String(retryAfter), 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
