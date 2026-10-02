'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  AtSign,
  CornerDownLeft,
  FileText,
  FolderGit2,
  Gamepad2,
  Moon,
  Rss,
  Search,
} from 'lucide-react';
import { siteConfig } from '@/lib/constants';
import { cn } from '@/lib/utils';

const OPEN_EVENT = 'sbv:command-palette';

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

type Item = {
  id: string;
  group: 'Pages' | 'Writing' | 'Work' | 'Actions';
  title: string;
  hint?: string;
  keywords?: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
};

type SearchIndex = {
  articles: { slug: string; title: string; category: string }[];
  projects: { slug: string; title: string; domain: string }[];
};

function score(item: Item, q: string) {
  if (!q) return 1;
  const title = item.title.toLowerCase();
  const hay = `${title} ${item.hint ?? ''} ${item.keywords ?? ''}`.toLowerCase();
  if (title.startsWith(q)) return 3;
  if (title.includes(q)) return 2;
  if (hay.includes(q)) return 1;
  // Loose subsequence match so "idx pos" finds "Indoor Positioning".
  let i = 0;
  for (const ch of hay) if (ch === q[i]) i++;
  return i === q.length ? 0.5 : 0;
}

export function CommandPalette() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
    if (!index) {
      fetch('/api/search')
        .then((r) => (r.ok ? r.json() : null))
        .then((data: SearchIndex | null) => data && setIndex(data))
        .catch(() => {});
    }
  }, [open, index]);

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => {
      close();
      router.push(href);
    };
    const external = (href: string) => () => {
      close();
      window.open(href, '_blank', 'noopener,noreferrer');
    };

    const pages: Item[] = [
      { id: 'p-home', group: 'Pages', title: 'Home', icon: ArrowRight, run: go('/') },
      ...siteConfig.navigation.map((n) => ({
        id: `p-${n.href}`,
        group: 'Pages' as const,
        title: n.name,
        hint: n.href,
        icon: ArrowRight,
        run: go(n.href),
      })),
    ];

    const writing: Item[] = (index?.articles ?? []).map((a) => ({
      id: `a-${a.slug}`,
      group: 'Writing',
      title: a.title,
      hint: a.category,
      icon: FileText,
      run: go(`/insights/${a.slug}`),
    }));

    const work: Item[] = (index?.projects ?? []).map((p) => ({
      id: `w-${p.slug}`,
      group: 'Work',
      title: p.title,
      hint: p.domain,
      icon: FolderGit2,
      run: go(`/work/${p.slug}`),
    }));

    const actions: Item[] = [
      {
        id: 'x-theme',
        group: 'Actions',
        title: `Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} theme`,
        keywords: 'theme dark light mode',
        icon: Moon,
        run: () => {
          setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
          close();
        },
      },
      {
        id: 'x-email',
        group: 'Actions',
        title: 'Copy email address',
        hint: siteConfig.links.email,
        keywords: 'mail contact',
        icon: AtSign,
        run: () => {
          navigator.clipboard?.writeText(siteConfig.links.email).catch(() => {});
          close();
        },
      },
      {
        id: 'x-resume',
        group: 'Actions',
        title: 'Open résumé (PDF)',
        keywords: 'resume cv',
        icon: FileText,
        run: external(siteConfig.resume),
      },
      {
        id: 'x-github',
        group: 'Actions',
        title: 'GitHub profile',
        hint: 'github.com/shashi-bhushan-27',
        icon: ArrowRight,
        run: external(siteConfig.links.github),
      },
      {
        id: 'x-linkedin',
        group: 'Actions',
        title: 'LinkedIn profile',
        icon: ArrowRight,
        run: external(siteConfig.links.linkedin),
      },
      {
        id: 'x-play',
        group: 'Actions',
        title: 'Play SHASHI.EXE',
        hint: '/play',
        keywords: 'game rpg interactive',
        icon: Gamepad2,
        run: go('/play'),
      },
      {
        id: 'x-rss',
        group: 'Actions',
        title: 'RSS feed',
        hint: '/feed.xml',
        keywords: 'subscribe atom',
        icon: Rss,
        run: external('/feed.xml'),
      },
    ];

    return [...pages, ...writing, ...work, ...actions];
  }, [index, resolvedTheme, router, setTheme, close]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groupRank = { Pages: 0, Writing: 1, Work: 2, Actions: 3 };
    return items
      .map((item, order) => ({ item, s: score(item, q), order }))
      .filter((r) => r.s > 0)
      .sort((a, b) => (q ? b.s - a.s : 0) || a.order - b.order)
      .slice(0, q ? 12 : 40)
      .sort((a, b) => groupRank[a.item.group] - groupRank[b.item.group])
      .map((r) => r.item);
  }, [items, query]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      results[active]?.run();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <div
            className="absolute inset-0 bg-bg/70 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command menu"
            initial={{ opacity: 0, y: -8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl overflow-hidden rounded-md border border-border bg-surface shadow-[0_24px_80px_-12px_rgb(0_0_0/0.5)]"
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-4 text-fg-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="Jump to a page, article, or project…"
                className="h-12 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-faint"
                role="combobox"
                aria-expanded="true"
                aria-controls="command-list"
                aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
              />
              <kbd className="label-mono rounded-[3px] border border-line px-1.5 py-0.5 text-fg-faint">
                esc
              </kbd>
            </div>

            <ul
              id="command-list"
              ref={listRef}
              role="listbox"
              className="max-h-[min(60vh,420px)] overflow-y-auto py-2"
            >
              {results.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-fg-faint">
                  No matches for “{query}”.
                </li>
              )}
              {results.map((item, i) => {
                const header = i === 0 || results[i - 1].group !== item.group ? item.group : null;
                return (
                  <li key={item.id} role="presentation">
                    {header && (
                      <p className="label-mono px-4 pt-3 pb-1.5 text-fg-faint">{header}</p>
                    )}
                    <div
                      id={`cmd-${item.id}`}
                      role="option"
                      aria-selected={i === active}
                      data-index={i}
                      onMouseMove={() => setActive(i)}
                      onClick={item.run}
                      className={cn(
                        'mx-2 flex cursor-pointer items-center gap-3 rounded-[4px] px-2.5 py-2 text-sm',
                        i === active ? 'bg-surface-2 text-fg' : 'text-fg-muted'
                      )}
                    >
                      <item.icon className="size-4 shrink-0 text-fg-faint" />
                      <span className="truncate">{item.title}</span>
                      {item.hint && (
                        <span className="ml-auto shrink-0 truncate pl-4 font-mono text-[11px] text-fg-faint">
                          {item.hint}
                        </span>
                      )}
                      {i === active && !item.hint && (
                        <CornerDownLeft className="ml-auto size-3.5 text-fg-faint" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 label-mono text-fg-faint">
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span className="ml-auto">{results.length} results</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
