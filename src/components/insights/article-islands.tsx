'use client';

import { useEffect, useState } from 'react';
import { Link2, Check } from 'lucide-react';
import { LinkedinIcon, TwitterIcon } from '@/components/icons';
import type { TocItem } from '@/lib/types';
import { cn } from '@/lib/utils';

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = document.getElementById('article-body');
        if (!el) return;
        const start = el.offsetTop - window.innerHeight * 0.3;
        const end = el.offsetTop + el.offsetHeight - window.innerHeight;
        setProgress(Math.min(1, Math.max(0, (window.scrollY - start) / (end - start))));
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-[55] h-[2px]" aria-hidden>
      <div
        className="h-full origin-left bg-signal"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}

/** Table of contents with scroll-spy. */
export function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => !!el);
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -65% 0px' }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <nav aria-label="On this page">
      <p className="label-mono text-fg-faint">On this page</p>
      <ol className="mt-4 space-y-0.5 border-l border-line">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                '-ml-px block border-l py-1 text-[13px] leading-snug transition-colors',
                item.depth === 3 ? 'pl-6' : 'pl-3',
                active === item.id
                  ? 'border-signal-ink text-fg'
                  : 'border-transparent text-fg-faint hover:text-fg-muted'
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function ShareLinks({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const btn =
    'flex size-8 items-center justify-center rounded-[4px] border border-line text-fg-muted transition-colors hover:border-border hover:text-fg';

  return (
    <div className="flex items-center gap-1.5">
      <a
        className={btn}
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
      >
        <TwitterIcon className="size-3.5" />
      </a>
      <a
        className={btn}
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
      >
        <LinkedinIcon className="size-3.5" />
      </a>
      <button
        type="button"
        className={btn}
        aria-label={copied ? 'Link copied' : 'Copy link'}
        onClick={() => {
          navigator.clipboard
            ?.writeText(url)
            .then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            })
            .catch(() => {});
        }}
      >
        {copied ? <Check className="size-3.5 text-signal-ink" /> : <Link2 className="size-3.5" />}
      </button>
      <span className="label-mono ml-1 text-fg-faint" aria-live="polite">
        {copied ? 'copied' : ''}
      </span>
    </div>
  );
}
