'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const suggestions = [
  'What is the indoor positioning patent about?',
  'Which projects use RAG?',
  'What is his tech stack?',
];

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading, append, error } =
    useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isLoading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className="fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {open && (
          <motion.section
            aria-label="Portfolio assistant"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 bottom-12 flex h-[520px] max-h-[calc(100dvh-7rem)] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-md border border-border bg-surface shadow-[0_24px_64px_-16px_rgb(0_0_0/0.45)]"
          >
            <header className="flex items-center gap-2 border-b border-line px-4 py-3">
              <span className="size-1.5 bg-signal" />
              <span className="label-mono text-fg-muted">assistant</span>
              <span className="label-mono text-fg-faint">· llama-3.1-8b via groq</span>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto rounded-[3px] p-1 text-fg-faint hover:bg-surface-2 hover:text-fg"
                aria-label="Close assistant"
              >
                <X className="size-4" />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
              {messages.length === 0 ? (
                <div>
                  <p className="text-sm leading-relaxed text-fg-muted">
                    Ask about Shashi&apos;s projects, research, or stack. Answers come from a
                    small language model with a short brief — for anything important, use the
                    contact form.
                  </p>
                  <div className="mt-5 space-y-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => append({ role: 'user', content: s })}
                        className="block w-full rounded-[4px] border border-line px-3 py-2 text-left text-[13px] text-fg-muted transition-colors hover:border-border hover:text-fg"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id}>
                    <p
                      className={cn(
                        'label-mono mb-1.5',
                        m.role === 'user' ? 'text-fg-faint' : 'text-signal-ink'
                      )}
                    >
                      {m.role === 'user' ? 'you' : 'assistant'}
                    </p>
                    <p
                      className={cn(
                        'whitespace-pre-wrap text-sm leading-relaxed',
                        m.role === 'user' ? 'text-fg' : 'text-fg-muted'
                      )}
                    >
                      {m.content}
                    </p>
                  </div>
                ))
              )}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <p className="label-mono text-signal-ink">
                  assistant <span className="animate-[blink_1s_steps(1)_infinite]">▍</span>
                </p>
              )}
              {error && (
                <p className="text-[13px] text-danger">
                  The assistant is unavailable right now. Try again in a moment.
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-line p-2">
              <span className="pl-2 font-mono text-sm text-signal-ink">›</span>
              <input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder="Type a question"
                className="h-9 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-faint"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex size-8 items-center justify-center rounded-[4px] bg-signal text-on-signal transition-opacity disabled:opacity-30"
                aria-label="Send"
              >
                <ArrowUp className="size-4" />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-9 items-center gap-2 rounded-[4px] border border-border bg-surface/90 px-3 text-fg-muted shadow-lg backdrop-blur transition-colors hover:text-fg"
      >
        <span className={cn('size-1.5', open ? 'bg-fg-faint' : 'bg-signal')} />
        <span className="label-mono">{open ? 'close' : 'ask ai'}</span>
      </button>
    </div>
  );
}
