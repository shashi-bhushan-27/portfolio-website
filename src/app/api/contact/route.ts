import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { clientIpFrom, rateLimit, type Limit } from '@/lib/rate-limit';

const MAX = { name: 120, email: 200, subject: 200, message: 5000 };

const RATE_LIMITS: Limit[] = [
  { name: 'ten-minutes', limit: 3, windowSec: 10 * 60 },
  { name: 'day', limit: 10, windowSec: 24 * 60 * 60 },
  // Caps total mail per day so a botnet can't burn through the Resend quota.
  { name: 'site-day', limit: 200, windowSec: 24 * 60 * 60, scope: 'global' },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(body: unknown, key: keyof typeof MAX) {
  const v = (body as Record<string, unknown> | null)?.[key];
  return typeof v === 'string' ? v.trim() : '';
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = field(body, 'name');
  const email = field(body, 'email');
  const subject = field(body, 'subject');
  const message = field(body, 'message');

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email and message are required.' }, { status: 400 });
  }
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: 'That email address doesn’t look right.' }, { status: 400 });
  }
  for (const [key, value] of Object.entries({ name, email, subject, message })) {
    if (value.length > MAX[key as keyof typeof MAX]) {
      return NextResponse.json(
        { error: `The ${key} is too long (max ${MAX[key as keyof typeof MAX]} characters).` },
        { status: 400 }
      );
    }
  }

  const limited = await rateLimit('contact', clientIpFrom(request.headers), RATE_LIMITS);
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Too many messages from your connection. Please try again later, or email me directly.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('Contact form: RESEND_API_KEY is not set');
    return NextResponse.json({ error: 'The contact form is unavailable right now.' }, { status: 503 });
  }

  try {
    // Sent to yourself from Resend's shared sender until a custom domain is verified.
    const { data, error } = await new Resend(apiKey).emails.send({
      from: 'onboarding@resend.dev',
      to: 'shashibhushan27072002@gmail.com',
      replyTo: email,
      subject: `New Portfolio Message: ${subject || 'No Subject'}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Contact error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
