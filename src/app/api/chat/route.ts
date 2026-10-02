import { createUIMessageStreamResponse, streamText, toUIMessageStream, type ModelMessage } from 'ai';
import { getKnowledge } from '@/lib/assistant/knowledge';
import { assistantModel } from '@/lib/assistant/model';
import { buildInstructions } from '@/lib/assistant/prompt';
import { clientIpFrom, rateLimit, tooManyRequests, type Limit } from '@/lib/rate-limit';

export const maxDuration = 30;

const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY = 12; // messages sent to the model, newest last
const MAX_ASSISTANT_CHARS = 2000;
const MAX_BODY_MESSAGES = 60;

const RATE_LIMITS: Limit[] = [
  { name: 'minute', limit: 8, windowSec: 60 },
  { name: 'hour', limit: 40, windowSec: 60 * 60 },
  { name: 'day', limit: 100, windowSec: 24 * 60 * 60 },
  // Hard ceiling for the whole site, so the API key can't be run up by many IPs.
  {
    name: 'site-day',
    limit: Number(process.env.CHAT_DAILY_LIMIT) || 2000,
    windowSec: 24 * 60 * 60,
    scope: 'global',
  },
];

function text(res: string, status: number) {
  return new Response(res, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

/**
 * Accept only user/assistant text from the client. Tool, file, and system
 * parts are dropped, so a crafted request can't smuggle in instructions
 * beyond plain conversation.
 */
function parseMessages(body: unknown):
  | { ok: true; messages: ModelMessage[]; query: string }
  | { ok: false; error: string } {
  const raw = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_BODY_MESSAGES) {
    return { ok: false, error: 'Invalid conversation.' };
  }

  const turns: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const m of raw as { role?: unknown; parts?: unknown }[]) {
    if (m?.role !== 'user' && m?.role !== 'assistant') continue;
    const content = Array.isArray(m.parts)
      ? (m.parts as { type?: unknown; text?: unknown }[])
          .filter((p) => p?.type === 'text' && typeof p.text === 'string')
          .map((p) => p.text as string)
          .join('')
          .trim()
      : '';
    if (content) turns.push({ role: m.role, content });
  }

  const last = turns.at(-1);
  if (!last || last.role !== 'user') return { ok: false, error: 'Ask a question to get started.' };
  if (last.content.length > MAX_MESSAGE_CHARS) {
    return { ok: false, error: `Keep questions under ${MAX_MESSAGE_CHARS} characters.` };
  }

  const history = turns.slice(-MAX_HISTORY).map((t) => ({
    role: t.role,
    content: t.content.slice(0, t.role === 'user' ? MAX_MESSAGE_CHARS : MAX_ASSISTANT_CHARS),
  }));
  // Retrieval looks at the latest question plus the one before it, for follow-ups like "and its stack?".
  const query = turns
    .filter((t) => t.role === 'user')
    .slice(-2)
    .map((t) => t.content)
    .join(' ');

  return { ok: true, messages: history, query };
}

export async function POST(req: Request) {
  const model = assistantModel();
  if (!model) return text('The assistant isn’t set up yet.', 503);

  const parsed = parseMessages(await req.json().catch(() => null));
  if (!parsed.ok) return text(parsed.error, 400);

  const limited = await rateLimit('chat', clientIpFrom(req.headers), RATE_LIMITS);
  if (!limited.ok) {
    return tooManyRequests(
      limited.retryAfter,
      limited.name === 'site-day'
        ? 'The assistant has reached its daily limit. Please use the contact page instead.'
        : 'You’re sending messages quickly — please wait a moment and try again.'
    );
  }

  let knowledge;
  try {
    knowledge = await getKnowledge();
  } catch (e) {
    console.error('[chat] knowledge load failed', e);
    return text('The assistant is unavailable right now. Please try again shortly.', 503);
  }

  const result = streamText({
    model,
    instructions: buildInstructions(knowledge, parsed.query),
    messages: parsed.messages,
    maxOutputTokens: 800,
    temperature: 0.3,
    reasoning: 'minimal',
    maxRetries: 0, // the model chain in lib/assistant/model.ts already fails over

    abortSignal: req.signal,
    onError: ({ error }) => console.error('[chat] generation failed', error),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      sendReasoning: false,
      onError: () => 'The assistant couldn’t answer that just now. Please try again in a moment.',
    }),
  });
}
