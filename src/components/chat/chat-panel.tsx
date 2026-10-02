'use client';

import { Chat, useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowUp, RotateCcw, Square, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/*
 * Lives at module scope so the conversation survives closing and reopening
 * the panel (the panel unmounts on close). This module is only loaded once
 * someone opens the assistant.
 */
const chat = new Chat<UIMessage>({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
});

const MAX_CHARS = 1000;

const suggestions = [
  'What is the indoor positioning patent about?',
  'Which projects use RAG?',
  'What has he written about LLMs?',
];

function messageText(m: UIMessage) {
  return m.parts
    .filter((p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

/** Site pages an answer links to, in order of first mention. */
function siteSources(markdown: string) {
  const seen = new Set<string>();
  for (const [, href] of markdown.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    if (!href.startsWith('//')) seen.add(href);
  }
  return [...seen].slice(0, 6);
}

function ChatLink({ href = '', children }: ComponentProps<'a'>) {
  const pathname = usePathname();

  if (href.startsWith('/') && !href.startsWith('//')) {
    // A hash on the current page is a plain anchor so `hashchange` fires
    // (the Systems page switches diagrams on it); other pages go through the router.
    const [path] = href.split('#');
    if (href.includes('#') && (path === '' || path === pathname)) {
      return (
        <a href={href} className="text-fg underline decoration-signal-ink/60 underline-offset-2 hover:decoration-signal-ink">
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className="text-fg underline decoration-signal-ink/60 underline-offset-2 hover:decoration-signal-ink">
        {children}
      </Link>
    );
  }
  if (/^(https:\/\/|mailto:)/.test(href)) {
    return (
      <a
        href={href}
        target={href.startsWith('mailto:') ? undefined : '_blank'}
        rel="noopener noreferrer"
        className="text-fg underline decoration-line underline-offset-2 hover:decoration-fg-faint"
      >
        {children}
      </a>
    );
  }
  return <>{children}</>;
}

function Answer({ markdown }: { markdown: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed text-fg-muted [&_li]:pl-0.5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-4 [&_strong]:font-medium [&_strong]:text-fg [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4 [&_code]:font-mono [&_code]:text-[12.5px] [&_code]:text-fg">
      <ReactMarkdown
        allowedElements={['p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'code', 'br']}
        unwrapDisallowed
        components={{ a: ChatLink }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

function Sources({ hrefs }: { hrefs: string[] }) {
  if (hrefs.length === 0) return null;
  return (
    <div className="mt-3 border-t border-line pt-2.5">
      <p className="label-mono text-fg-faint">Sources on this site</p>
      <ul className="mt-1.5 space-y-1">
        {hrefs.map((href) => (
          <li key={href} className="truncate">
            <ChatLink href={href}>
              <span className="font-mono text-[11.5px]">{href}</span>
            </ChatLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Server errors are plain sentences meant for visitors; anything else gets a generic line. */
function errorMessage(error: Error) {
  const msg = error.message?.trim() ?? '';
  return msg && msg.length < 200 && !msg.startsWith('{') && !/fetch/i.test(msg)
    ? msg
    : 'The assistant is unavailable right now. Try again in a moment.';
}

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const { messages, sendMessage, status, error, stop, regenerate, setMessages, clearError } = useChat({ chat });
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    clearError();
    sendMessage({ text: q.slice(0, MAX_CHARS) });
    setInput('');
  }

  const last = messages.at(-1);
  const waiting = status === 'submitted' || (status === 'streaming' && last?.role === 'assistant' && !messageText(last));

  return (
    <>
      <header className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="size-1.5 bg-signal" />
        <span className="label-mono text-fg-muted">assistant</span>
        <span className="label-mono text-fg-faint">· answers from this site</span>
        <div className="ml-auto flex items-center gap-0.5">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                stop();
                setMessages([]);
                clearError();
              }}
              className="rounded-[3px] p-1 text-fg-faint hover:bg-surface-2 hover:text-fg"
              aria-label="Start a new conversation"
              title="New conversation"
            >
              <RotateCcw className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-[3px] p-1 text-fg-faint hover:bg-surface-2 hover:text-fg"
            aria-label="Close assistant"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-4 py-5" aria-live="polite">
        {messages.length === 0 ? (
          <div>
            <p className="text-sm leading-relaxed text-fg-muted">
              Ask about Shashi&apos;s projects, research, or writing. Answers come only from this
              site and link to the pages they&apos;re drawn from — for anything important, use the
              contact form.
            </p>
            <div className="mt-5 space-y-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="block w-full rounded-[4px] border border-line px-3 py-2 text-left text-[13px] text-fg-muted transition-colors hover:border-border hover:text-fg"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const body = messageText(m);
            if (!body) return null;
            const done = !(m === last && busy);
            return (
              <div key={m.id}>
                <p className={cn('label-mono mb-1.5', m.role === 'user' ? 'text-fg-faint' : 'text-signal-ink')}>
                  {m.role === 'user' ? 'you' : 'assistant'}
                </p>
                {m.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{body}</p>
                ) : (
                  <>
                    <Answer markdown={body} />
                    {done && <Sources hrefs={siteSources(body)} />}
                  </>
                )}
              </div>
            );
          })
        )}
        {waiting && (
          <p className="label-mono text-signal-ink">
            assistant <span className="animate-[blink_1s_steps(1)_infinite]">▍</span>
          </p>
        )}
        {error && (
          <div className="text-[13px] text-danger">
            <p>{errorMessage(error)}</p>
            <button
              type="button"
              onClick={() => {
                clearError();
                regenerate();
              }}
              className="label-mono mt-2 text-fg-muted underline underline-offset-2 hover:text-fg"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-center gap-2 border-t border-line p-2"
      >
        <span className="pl-2 font-mono text-sm text-signal-ink" aria-hidden>
          ›
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={MAX_CHARS}
          placeholder="Type a question"
          aria-label="Your question"
          className="h-9 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-faint"
        />
        {busy ? (
          <button
            type="button"
            onClick={() => stop()}
            className="flex size-8 items-center justify-center rounded-[4px] border border-border text-fg-muted hover:text-fg"
            aria-label="Stop answering"
          >
            <Square className="size-3.5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex size-8 items-center justify-center rounded-[4px] bg-signal text-on-signal transition-opacity disabled:opacity-30"
            aria-label="Send"
          >
            <ArrowUp className="size-4" />
          </button>
        )}
      </form>
    </>
  );
}
