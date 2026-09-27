'use client';

import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  Columns2,
  Eye,
  ImagePlus,
  PenLine,
  SlidersHorizontal,
  TriangleAlert,
  X,
} from 'lucide-react';
import { deleteArticle, updateArticle, type ArticleInput } from '@/app/admin/actions';
import { MarkdownEditor } from '@/components/admin/markdown-editor';
import { TagInput } from '@/components/admin/tag-input';
import { StatusPill } from '@/components/admin/article-table';
import { Markdown } from '@/components/markdown/markdown';
import { buttonStyles } from '@/components/ui/button';
import { extractToc, readingTime, slugify, suggestExcerpt, wordCount } from '@/lib/markdown';
import type { ArticleData, ArticleStatus } from '@/lib/types';
import { cn, timeAgo } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks';

type Draft = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featured: boolean;
  publishedAt: string; // <input type="datetime-local"> value, local time
  coverImage: string;
};

type Mode = 'save' | 'publish' | 'unpublish' | 'autosave';
type View = 'write' | 'split' | 'preview';

const EXCERPT_MAX = 400;

function toLocalInput(date: Date) {
  const off = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - off).toISOString().slice(0, 16);
}

function draftFrom(a: ArticleData): Draft {
  return {
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    content: a.content ?? '',
    category: a.category,
    tags: a.tags,
    featured: a.featured,
    publishedAt: toLocalInput(new Date(a.publishedAt)),
    coverImage: a.coverImage ?? '',
  };
}

function toInput(d: Draft): ArticleInput {
  return {
    title: d.title,
    slug: d.slug,
    excerpt: d.excerpt,
    content: d.content,
    category: d.category,
    tags: d.tags,
    featured: d.featured,
    publishedAt: new Date(d.publishedAt).toISOString(),
    coverImage: d.coverImage || null,
  };
}

const snapshot = (d: Draft) => JSON.stringify(d);

async function uploadImage(file: File) {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch('/api/admin/upload', { method: 'POST', body });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed.');
  return data.url;
}

function Label({ htmlFor, children, aside }: { htmlFor: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="label-mono mb-2 flex items-baseline justify-between text-fg-faint">
      <span>{children}</span>
      {aside}
    </label>
  );
}

const field = (invalid?: boolean) =>
  cn(
    'w-full rounded-[4px] border bg-surface/40 px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-fg-faint',
    invalid ? 'border-danger/70' : 'border-line'
  );

export function ArticleEditor({
  article,
  categories,
  tagSuggestions,
}: {
  article: ArticleData;
  categories: string[];
  tagSuggestions: string[];
}) {
  const router = useRouter();
  const id = article.id;
  const [status, setStatus] = useState<ArticleStatus>(article.status);
  const [updatedAt, setUpdatedAt] = useState(article.updatedAt);
  const [liveSlug, setLiveSlug] = useState(article.status === 'PUBLISHED' ? article.slug : null);
  const [draft, setDraft] = useState<Draft>(() => draftFrom(article));
  const [saved, setSaved] = useState(() => snapshot(draftFrom(article)));
  // Fresh drafts get a placeholder slug; keep deriving it from the title until it's edited by hand.
  const placeholderSlug = /^untitled-[0-9a-f]+$/.test(article.slug) ? article.slug : null;
  const [slugTouched, setSlugTouched] = useState(!placeholderSlug);
  const [pending, setPending] = useState<Mode | null>(null);
  const [error, setError] = useState<{ message: string; field?: string; conflict?: boolean } | null>(null);
  const [notice, setNotice] = useState<{ message: string; href?: string } | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [view, setView] = useState<View>('split');
  // Settings panel: open by default on wide screens, closed on phones, until toggled.
  const wide = useMediaQuery('(min-width: 1024px)', true);
  const [panelPref, setPanelOpen] = useState<boolean | null>(null);
  const panelOpen = panelPref ?? wide;
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [recovery, setRecovery] = useState<{ draft: Draft; at: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [, setTick] = useState(0);

  const previewRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef(draft);
  const pendingRef = useRef<Mode | null>(null);
  useLayoutEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const dirty = snapshot(draft) !== saved;
  const content = useDeferredValue(draft.content);
  const words = useMemo(() => wordCount(content), [content]);
  const minutes = useMemo(() => readingTime(content), [content]);
  const outline = useMemo(() => {
    try {
      return extractToc(content);
    } catch {
      return [];
    }
  }, [content]);

  const backupKey = `sbv-studio:${id}`;

  const set = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  }, []);

  /* ─── Save / publish ─── */

  const save = useCallback(
    async (mode: Mode, force = false) => {
      if (pendingRef.current) return;
      const target: ArticleStatus = mode === 'publish' ? 'PUBLISHED' : mode === 'unpublish' ? 'DRAFT' : status;
      const current = draftRef.current;
      const snap = snapshot(current);

      pendingRef.current = mode;
      setPending(mode);
      if (mode !== 'autosave') setError(null);

      const res = await updateArticle(id, toInput(current), {
        status: target,
        expectedUpdatedAt: force ? undefined : updatedAt,
      });

      pendingRef.current = null;
      setPending(null);

      if (!res.ok) {
        // Autosave stays quiet about validation (the author is mid-thought) but not about conflicts.
        if (mode !== 'autosave' || res.conflict) {
          setError({ message: res.error, field: res.field, conflict: res.conflict });
        }
        return;
      }

      const a = res.article;
      // Publishing fills an empty excerpt from the body; show what was used.
      let savedSnap = snap;
      if (!current.excerpt.trim() && a.excerpt) {
        savedSnap = snapshot({ ...current, excerpt: a.excerpt });
        setDraft((d) => (d.excerpt.trim() ? d : { ...d, excerpt: a.excerpt }));
      }
      setStatus(a.status);
      setUpdatedAt(a.updatedAt);
      setLiveSlug(a.status === 'PUBLISHED' ? a.slug : null);
      setSaved(savedSnap);
      setSavedAt(Date.now());
      setError(null);
      try {
        localStorage.removeItem(`sbv-studio:${a.id}`);
      } catch {}

      if (mode === 'publish') setNotice({ message: 'Published — it’s live now.', href: `/insights/${a.slug}` });
      else if (mode === 'unpublish') setNotice({ message: 'Unpublished — removed from the site.' });
      else if (mode === 'save' && a.status === 'PUBLISHED')
        setNotice({ message: 'Live article updated.', href: `/insights/${a.slug}` });
    },
    [id, status, updatedAt]
  );

  // Drafts autosave after a pause in typing. Published articles never autosave:
  // half-finished edits shouldn't go live.
  useEffect(() => {
    if (status !== 'DRAFT' || !dirty || pending) return;
    const t = setTimeout(() => save('autosave'), 2500);
    return () => clearTimeout(t);
  }, [draft, status, dirty, pending, save]);

  /* ─── Local crash backup ─── */

  useEffect(() => {
    try {
      const raw = localStorage.getItem(backupKey);
      if (!raw) return;
      const b = JSON.parse(raw) as { draft: Draft; at: number };
      const newer = b.at > Date.parse(article.updatedAt);
      // localStorage only exists after hydration, so this can't be initial state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (newer && snapshot(b.draft) !== snapshot(draftFrom(article))) setRecovery(b);
    } catch {}
    // Only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(backupKey, JSON.stringify({ draft, at: Date.now() }));
      } catch {}
    }, 600);
    return () => clearTimeout(t);
  }, [draft, dirty, backupKey]);

  /* ─── Guards & shortcuts ─── */

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save('save');
      } else if (mod && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        save(status === 'PUBLISHED' ? 'save' : 'publish');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save, status]);

  // Keep "saved 12s ago" fresh.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 15_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  const syncPreview = useCallback((ratio: number) => {
    const el = previewRef.current;
    if (el) el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
  }, []);

  function leave(e: React.MouseEvent) {
    if (dirty && !window.confirm('You have unsaved changes. Leave anyway?')) e.preventDefault();
  }

  async function remove() {
    const res = await deleteArticle(id);
    if (!res.ok) return setError({ message: res.error ?? 'Could not delete.' });
    try {
      localStorage.removeItem(backupKey);
    } catch {}
    setSaved(snapshot(draftRef.current)); // suppress the unsaved-changes guard
    router.push('/admin');
  }

  const saveState = pending
    ? pending === 'autosave'
      ? 'Autosaving…'
      : 'Saving…'
    : dirty
      ? status === 'PUBLISHED'
        ? 'Unsaved — not live yet'
        : 'Unsaved changes'
      : savedAt
        ? `Saved ${timeAgo(new Date(savedAt).toISOString())}`
        : 'All changes saved';

  const fieldError = (name: keyof Draft) => error?.field === name;
  const slugChangedWhileLive = !!liveSlug && draft.slug !== liveSlug;

  return (
    <div className="flex h-dvh flex-col">
      {/* ─── Top bar ─── */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-3">
        <Link
          href="/admin"
          onClick={leave}
          className="label-mono inline-flex h-8 items-center gap-1.5 rounded-[4px] px-2 text-fg-muted hover:bg-surface hover:text-fg"
        >
          <ArrowLeft className="size-3.5" />
          Articles
        </Link>
        <StatusPill status={status} />
        <span
          className={cn('label-mono hidden sm:inline', dirty ? 'text-warn' : 'text-fg-faint')}
          aria-live="polite"
        >
          {saveState}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden rounded-[4px] border border-line p-0.5 md:flex" role="group" aria-label="Layout">
            {(
              [
                ['write', PenLine, 'Write'],
                ['split', Columns2, 'Split'],
                ['preview', Eye, 'Preview'],
              ] as const
            ).map(([v, Icon, label]) => (
              <button
                key={v}
                type="button"
                title={label}
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={cn(
                  'flex h-7 items-center gap-1.5 rounded-[3px] px-2 text-[12px]',
                  view === v ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:text-fg'
                )}
              >
                <Icon className="size-3.5" />
                <span className="hidden xl:inline">{label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            title="Article settings"
            aria-pressed={panelOpen}
            onClick={() => setPanelOpen(!panelOpen)}
            className={cn(
              'flex size-8 items-center justify-center rounded-[4px]',
              panelOpen ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:bg-surface hover:text-fg'
            )}
          >
            <SlidersHorizontal className="size-4" />
          </button>
          <Link
            href={`/admin/articles/${id}/preview`}
            target="_blank"
            title="Full-page preview"
            className="hidden size-8 items-center justify-center rounded-[4px] text-fg-muted hover:bg-surface hover:text-fg sm:flex"
          >
            <Eye className="size-4" />
          </Link>
          {liveSlug && (
            <a
              href={`/insights/${liveSlug}`}
              target="_blank"
              className="label-mono hidden h-8 items-center gap-1 rounded-[4px] px-2 text-fg-muted hover:bg-surface hover:text-fg lg:inline-flex"
            >
              Live <ArrowUpRight className="size-3" />
            </a>
          )}

          {status === 'PUBLISHED' ? (
            <>
              <button
                type="button"
                onClick={() => save('unpublish')}
                disabled={!!pending}
                className={cn(buttonStyles({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}
              >
                Unpublish
              </button>
              <button
                type="button"
                onClick={() => save('save')}
                disabled={!!pending || !dirty}
                title="Update the live article (Ctrl/⌘ S)"
                className={buttonStyles({ variant: 'primary', size: 'sm' })}
              >
                {pending === 'save' ? 'Updating…' : 'Update live'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => save('save')}
                disabled={!!pending}
                title="Save draft (Ctrl/⌘ S)"
                className={buttonStyles({ variant: 'secondary', size: 'sm' })}
              >
                Save draft
              </button>
              <button
                type="button"
                onClick={() => save('publish')}
                disabled={!!pending}
                title="Publish (Ctrl/⌘ Shift Enter)"
                className={buttonStyles({ variant: 'primary', size: 'sm' })}
              >
                {pending === 'publish' ? 'Publishing…' : 'Publish'}
              </button>
            </>
          )}
        </div>
      </header>

      {/* ─── Banners ─── */}
      {recovery && (
        <div className="flex flex-wrap items-center gap-3 border-b border-warn/30 bg-warn/10 px-4 py-2 text-sm">
          <TriangleAlert className="size-4 text-warn" />
          <span className="text-fg">
            Unsaved changes from {timeAgo(new Date(recovery.at).toISOString())} were found in this browser.
          </span>
          <button
            type="button"
            className="label-mono text-fg link-underline"
            onClick={() => {
              setDraft(recovery.draft);
              setSlugTouched(true);
              setRecovery(null);
            }}
          >
            Restore
          </button>
          <button
            type="button"
            className="label-mono text-fg-muted hover:text-fg"
            onClick={() => {
              try {
                localStorage.removeItem(backupKey);
              } catch {}
              setRecovery(null);
            }}
          >
            Discard
          </button>
        </div>
      )}
      {error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 border-b border-danger/30 bg-danger/10 px-4 py-2 text-sm">
          <TriangleAlert className="size-4 text-danger" />
          <span className="text-fg">{error.message}</span>
          {error.conflict && (
            <>
              <button type="button" className="label-mono text-fg link-underline" onClick={() => window.location.reload()}>
                Load latest (discards mine)
              </button>
              <button type="button" className="label-mono text-danger link-underline" onClick={() => save('save', true)}>
                Overwrite with mine
              </button>
            </>
          )}
          <button type="button" aria-label="Dismiss" className="ml-auto text-fg-muted hover:text-fg" onClick={() => setError(null)}>
            <X className="size-4" />
          </button>
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-center gap-3 border-b border-signal-ink/30 bg-signal/10 px-4 py-2 text-sm">
          <span className="size-1.5 bg-signal" />
          <span className="text-fg">{notice.message}</span>
          {notice.href && (
            <a href={notice.href} target="_blank" className="label-mono inline-flex items-center gap-1 text-fg link-underline">
              {notice.href} <ArrowUpRight className="size-3" />
            </a>
          )}
        </div>
      )}

      <div className="relative flex min-h-0 flex-1">
        {/* ─── Writing area ─── */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-line px-6 py-5 sm:px-8">
            <textarea
              value={draft.title}
              onChange={(e) => {
                const title = e.target.value.replace(/\n/g, ' ');
                setDraft((d) => ({
                  ...d,
                  title,
                  slug: slugTouched ? d.slug : slugify(title) || placeholderSlug || d.slug,
                }));
              }}
              rows={1}
              placeholder="Article title"
              aria-label="Title"
              aria-invalid={fieldError('title')}
              className={cn(
                'w-full resize-none bg-transparent text-[clamp(1.5rem,2.6vw,2.1rem)] leading-tight font-medium tracking-[-0.03em] text-fg outline-none [field-sizing:content] placeholder:text-fg-faint',
                fieldError('title') && 'text-danger'
              )}
            />
          </div>

          <div
            className={cn(
              'grid min-h-0 flex-1',
              view === 'split' && 'lg:grid-cols-2',
              view === 'preview' && 'grid-cols-1'
            )}
          >
            {view !== 'preview' && (
              <MarkdownEditor
                value={draft.content}
                onChange={(v) => set('content', v)}
                onUpload={uploadImage}
                onCursor={setCursor}
                onScrollRatio={view === 'split' ? syncPreview : undefined}
                onError={(message) => setError({ message })}
                className="lg:border-r lg:border-line"
              />
            )}
            {view !== 'write' && (
              <div
                ref={previewRef}
                className={cn('min-h-0 overflow-y-auto bg-surface/20', view === 'split' && 'hidden lg:block')}
              >
                <div className="mx-auto max-w-[68ch] px-6 py-8 sm:px-10">
                  <p className="label-mono text-fg-faint">Preview · {draft.category || 'Uncategorised'}</p>
                  <h1 className="mt-4 text-3xl leading-tight font-medium tracking-[-0.035em] text-fg text-balance">
                    {draft.title || 'Untitled'}
                  </h1>
                  {draft.excerpt && <p className="mt-4 text-lg leading-relaxed text-fg-muted">{draft.excerpt}</p>}
                  <div className="mt-8 border-t border-line pt-8">
                    {content.trim() ? (
                      <Markdown source={content} />
                    ) : (
                      <p className="text-fg-faint">Nothing to preview yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <footer className="label-mono flex h-8 shrink-0 items-center gap-4 border-t border-line px-4 text-fg-faint">
            <span>{words.toLocaleString('en-US')} words</span>
            <span>{minutes} min read</span>
            <span className="hidden sm:inline">
              Ln {cursor.line}, Col {cursor.col}
            </span>
            <span className="ml-auto hidden md:inline">Markdown · GFM</span>
            <span className="hidden md:inline">⌘/Ctrl S save</span>
          </footer>
        </main>

        {/* ─── Settings panel ─── */}
        {panelOpen && (
          <aside
            className="absolute inset-y-0 right-0 z-20 w-full max-w-[340px] overflow-y-auto border-l border-line bg-bg px-5 py-5 shadow-2xl lg:static lg:w-[320px] lg:shadow-none"
            aria-label="Article settings"
          >
            <div className="flex items-center justify-between lg:hidden">
              <p className="label-mono text-fg-faint">Settings</p>
              <button type="button" aria-label="Close settings" onClick={() => setPanelOpen(false)} className="text-fg-muted">
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <Label
                  htmlFor="slug"
                  aside={
                    !slugTouched ? (
                      <span className="normal-case tracking-normal">auto</span>
                    ) : (
                      <button
                        type="button"
                        className="normal-case tracking-normal hover:text-fg"
                        onClick={() => {
                          setSlugTouched(false);
                          set('slug', slugify(draft.title) || placeholderSlug || draft.slug);
                        }}
                      >
                        reset
                      </button>
                    )
                  }
                >
                  URL
                </Label>
                <div className={cn(field(fieldError('slug')), 'flex items-center gap-0 p-0')}>
                  <span className="pl-3 font-mono text-[12px] text-fg-faint">/insights/</span>
                  <input
                    id="slug"
                    value={draft.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                    }}
                    onBlur={() => set('slug', slugify(draft.slug) || slugify(draft.title) || placeholderSlug || article.slug)}
                    className="min-w-0 flex-1 bg-transparent py-2 pr-3 font-mono text-[12.5px] text-fg outline-none"
                  />
                </div>
                {slugChangedWhileLive && (
                  <p className="mt-2 text-[12px] leading-relaxed text-warn">
                    This article is live at /insights/{liveSlug}. Changing the URL breaks existing links to it.
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="excerpt"
                  aside={
                    <span className={cn('normal-case tracking-normal', draft.excerpt.length > EXCERPT_MAX && 'text-danger')}>
                      {draft.excerpt.length}/{EXCERPT_MAX}
                    </span>
                  }
                >
                  Excerpt
                </Label>
                <textarea
                  id="excerpt"
                  rows={4}
                  value={draft.excerpt}
                  onChange={(e) => set('excerpt', e.target.value)}
                  placeholder="One or two sentences shown on the listing, in search results, and when shared."
                  className={cn(field(fieldError('excerpt')), 'resize-y leading-relaxed')}
                />
                {draft.content.trim() && (
                  <button
                    type="button"
                    onClick={() => set('excerpt', suggestExcerpt(draft.content))}
                    className="label-mono mt-1.5 text-fg-faint hover:text-fg"
                  >
                    Use first paragraph
                  </button>
                )}
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <input
                  id="category"
                  list="category-options"
                  value={draft.category}
                  onChange={(e) => set('category', e.target.value)}
                  placeholder="e.g. System Design"
                  className={field(fieldError('category'))}
                />
                <datalist id="category-options">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <TagInput id="tags" value={draft.tags} onChange={(t) => set('tags', t)} suggestions={tagSuggestions} />
              </div>

              <div>
                <Label htmlFor="publishedAt">Publish date</Label>
                <input
                  id="publishedAt"
                  type="datetime-local"
                  value={draft.publishedAt}
                  onChange={(e) => set('publishedAt', e.target.value)}
                  className={cn(field(fieldError('publishedAt')), 'font-mono text-[12.5px] [color-scheme:inherit]')}
                />
                <p className="mt-1.5 text-[12px] text-fg-faint">Sets the order on the Insights page.</p>
              </div>

              <label className="flex cursor-pointer items-start justify-between gap-4">
                <span>
                  <span className="block text-sm text-fg">Pin to top</span>
                  <span className="block text-[12px] text-fg-faint">Shown in the pinned row on Insights.</span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => set('featured', e.target.checked)}
                  className="peer sr-only"
                />
                <span className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-surface-2 transition-colors peer-checked:bg-signal peer-focus-visible:outline-2 peer-focus-visible:outline-signal-ink after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-fg after:transition-transform peer-checked:after:translate-x-4 peer-checked:after:bg-on-signal" />
              </label>

              <div>
                <Label htmlFor="cover">Cover image</Label>
                {draft.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draft.coverImage} alt="" className="mb-2 aspect-[2/1] w-full border border-line object-cover" />
                )}
                <div className="flex gap-1.5">
                  <input
                    id="cover"
                    value={draft.coverImage}
                    onChange={(e) => set('coverImage', e.target.value)}
                    placeholder="https://…"
                    className={cn(field(fieldError('coverImage')), 'font-mono text-[12px]')}
                  />
                  <label className={cn(buttonStyles({ size: 'icon' }), 'shrink-0 cursor-pointer')} title="Upload cover">
                    <ImagePlus className="size-4" />
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif"
                      hidden
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        try {
                          set('coverImage', await uploadImage(file));
                        } catch (err) {
                          setError({ message: err instanceof Error ? err.message : 'Upload failed.' });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {outline.length > 0 && (
                <div>
                  <p className="label-mono mb-2 text-fg-faint">Outline</p>
                  <ol className="space-y-0.5 border-l border-line">
                    {outline.map((h) => (
                      <li key={h.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (view === 'write') setView('split');
                            requestAnimationFrame(() =>
                              previewRef.current?.querySelector(`#${CSS.escape(h.id)}`)?.scrollIntoView({ block: 'start' })
                            );
                          }}
                          className={cn(
                            '-ml-px block w-full truncate border-l border-transparent py-0.5 text-left text-[12.5px] text-fg-muted hover:border-fg-faint hover:text-fg',
                            h.depth === 3 ? 'pl-5' : 'pl-3'
                          )}
                        >
                          {h.text}
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="border-t border-line pt-5">
                {confirmDelete ? (
                  <div className="space-y-2">
                    <p className="text-sm text-fg">
                      Delete this article permanently?{status === 'PUBLISHED' && ' It will disappear from the site.'}
                    </p>
                    <div className="flex gap-2">
                      <button type="button" onClick={remove} className={buttonStyles({ variant: 'danger', size: 'sm' })}>
                        Delete
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(false)} className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="label-mono text-fg-faint hover:text-danger"
                  >
                    {status === 'PUBLISHED' || draft.title ? 'Delete article' : 'Discard draft'}
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
