'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

const loadPanel = () => import('./chat-panel');

/* The chat UI (AI SDK + Markdown) loads on first open, not with every page. */
const ChatPanel = dynamic(() => loadPanel().then((m) => m.ChatPanel), {
  ssr: false,
  loading: () => <p className="label-mono px-4 py-5 text-fg-faint">loading assistant…</p>,
});

export function AiAssistant() {
  const [open, setOpen] = useState(false);

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
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            className="absolute right-0 bottom-12 flex h-[540px] max-h-[calc(100dvh-7rem)] w-[400px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-md border border-border bg-surface shadow-[0_24px_64px_-16px_rgb(0_0_0/0.45)]"
          >
            <ChatPanel onClose={() => setOpen(false)} />
          </motion.section>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        // Start fetching the panel as soon as someone shows intent.
        onPointerEnter={loadPanel}
        onFocus={loadPanel}
        aria-expanded={open}
        className="flex h-9 items-center gap-2 rounded-[4px] border border-border bg-surface/90 px-3 text-fg-muted shadow-lg backdrop-blur transition-colors hover:text-fg"
      >
        <span className={cn('size-1.5', open ? 'bg-fg-faint' : 'bg-signal')} />
        <span className="label-mono">{open ? 'close' : 'ask ai'}</span>
      </button>
    </div>
  );
}
