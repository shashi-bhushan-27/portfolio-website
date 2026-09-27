'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Check, Eye, Plus, TriangleAlert, X } from 'lucide-react';
import { deleteProject, updateProject, type ProjectInput } from '@/app/admin/project-actions';
import { StatusPill } from '@/components/admin/article-table';
import { TagInput } from '@/components/admin/tag-input';
import { Markdown } from '@/components/markdown/markdown';
import { buttonStyles } from '@/components/ui/button';
import { slugify, wordCount } from '@/lib/markdown';
import { PROJECT_SECTIONS, type ProjectSectionKey } from '@/lib/project-sections';
import type { ProjectData, PublishStatus } from '@/lib/types';
import { cn, timeAgo } from '@/lib/utils';

type Draft = ProjectInput;
type Mode = 'save' | 'publish' | 'unpublish' | 'autosave';

const EXCERPT_MAX = 500;
const METRIC_MAX = 8;

function draftFrom(p: ProjectData): Draft {
  const sections = Object.fromEntries(PROJECT_SECTIONS.map((s) => [s.key, p[s.key]])) as Record<
    ProjectSectionKey,
    string
  >;
  return {
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    domain: p.domain,
    year: p.year,
    technologies: p.technologies,
    featured: p.featured,
    githubUrl: p.githubUrl ?? '',
    liveUrl: p.liveUrl ?? '',
    metrics: Object.entries(p.metrics ?? {}).map(([key, value]) => ({ key, value: String(value) })),
    ...sections,
  };
}

const snapshot = (d: Draft) => JSON.stringify(d);

const field = (invalid?: boolean) =>
  cn(
    'w-full rounded-[4px] border bg-surface/40 px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-fg-faint',
    invalid ? 'border-danger/70' : 'border-line'
  );

function Label({ htmlFor, children, aside }: { htmlFor: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="label-mono mb-2 flex items-baseline justify-between gap-3 text-fg-faint">
      <span>{children}</span>
      {aside}
    </label>
  );
}

function Group({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-6">
      <h2 className="text-lg font-medium tracking-[-0.01em] text-fg">{title}</h2>
      <p className="mt-1 text-sm text-fg-muted">{description}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function SectionField({
  sectionKey,
  label,
  hint,
  value,
  invalid,
  onChange,
}: {
  sectionKey: ProjectSectionKey;
  label: string;
  hint: string;
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const id = `section-${sectionKey}`;
  return (
    <div id={`${id}-block`} className="scroll-mt-20">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <label htmlFor={id} className={cn('text-[15px] font-medium', invalid ? 'text-danger' : 'text-fg')}>
          {label}
        </label>
        <div className="flex gap-0.5" role="tablist" aria-label={`${label} view`}>
          {(['write', 'preview'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                'label-mono rounded-[3px] px-2 py-1',
                tab === t ? 'bg-surface-2 text-fg' : 'text-fg-faint hover:text-fg'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-[13px] text-fg-faint">{hint}</p>
      {tab === 'write' ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder="Markdown: **bold**, lists, `code`, links…"
          className={cn(
            field(invalid),
            'mt-3 min-h-[7.5rem] resize-y font-mono text-[13px] leading-[1.75] [field-sizing:content]'
          )}
        />
      ) : (
        <div className="mt-3 min-h-[7.5rem] border border-line p-4">
          {value.trim() ? (
            <Markdown source={value} className="text-[15px]" />
          ) : (
            <p className="text-sm text-fg-faint">Nothing to preview — empty sections are hidden on the page.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function ProjectEditor({
  project,
  domains,
  techSuggestions,
}: {
  project: ProjectData;
  domains: string[];
  techSuggestions: string[];
}) {
  const router = useRouter();
  const id = project.id;
  const [status, setStatus] = useState<PublishStatus>(project.status);
  const [updatedAt, setUpdatedAt] = useState(project.updatedAt);
  const [liveSlug, setLiveSlug] = useState(project.status === 'PUBLISHED' ? project.slug : null);
  const [draft, setDraft] = useState<Draft>(() => draftFrom(project));
  const [saved, setSaved] = useState(() => snapshot(draftFrom(project)));
  // New drafts get a placeholder slug; keep deriving it from the title until edited by hand.
  const placeholderSlug = /^untitled-[0-9a-f]+$/.test(project.slug) ? project.slug : null;
  const [slugTouched, setSlugTouched] = useState(!placeholderSlug);
  const [pending, setPending] = useState<Mode | null>(null);
  const [error, setError] = useState<{ message: string; field?: string; conflict?: boolean } | null>(null);
  const [notice, setNotice] = useState<{ message: string; href?: string } | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [recovery, setRecovery] = useState<{ draft: Draft; at: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [, setTick] = useState(0);

  const draftRef = useRef(draft);
  const pendingRef = useRef<Mode | null>(null);
  useLayoutEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const dirty = snapshot(draft) !== saved;
  const backupKey = `sbv-studio:project:${id}`;

  const set = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  }, []);

  /* ─── Save / publish ─── */

  const save = useCallback(
    async (mode: Mode, force = false) => {
      if (pendingRef.current) return;
      const target: PublishStatus = mode === 'publish' ? 'PUBLISHED' : mode === 'unpublish' ? 'DRAFT' : status;
      const current = draftRef.current;
      const snap = snapshot(current);

      pendingRef.current = mode;
      setPending(mode);
      if (mode !== 'autosave') setError(null);

      const res = await updateProject(id, current, {
        status: target,
        expectedUpdatedAt: force ? undefined : updatedAt,
      });

      pendingRef.current = null;
      setPending(null);

      if (!res.ok) {
        if (mode !== 'autosave' || res.conflict) {
          setError({ message: res.error, field: res.field, conflict: res.conflict });
        }
        return;
      }

      const p = res.project;
      setStatus(p.status);
      setUpdatedAt(p.updatedAt);
      setLiveSlug(p.status === 'PUBLISHED' ? p.slug : null);
      setSaved(snap);
      setSavedAt(Date.now());
      setError(null);
      try {
        localStorage.removeItem(backupKey);
      } catch {}

      if (mode === 'publish') setNotice({ message: 'Published — it’s live on /work.', href: `/work/${p.slug}` });
      else if (mode === 'unpublish') setNotice({ message: 'Unpublished — removed from the site.' });
      else if (mode === 'save' && p.status === 'PUBLISHED')
        setNotice({ message: 'Live case study updated.', href: `/work/${p.slug}` });
    },
    [id, status, updatedAt, backupKey]
  );

  // Drafts autosave after a pause. Published projects never autosave.
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
      // localStorage only exists after hydration, so this can't be initial state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (b.at > Date.parse(project.updatedAt) && snapshot(b.draft) !== snapshot(draftFrom(project))) setRecovery(b);
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
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
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

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 15_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  function leave(e: React.MouseEvent) {
    if (dirty && !window.confirm('You have unsaved changes. Leave anyway?')) e.preventDefault();
  }

  async function remove() {
    const res = await deleteProject(id);
    if (!res.ok) return setError({ message: res.error });
    try {
      localStorage.removeItem(backupKey);
    } catch {}
    setSaved(snapshot(draftRef.current)); // suppress the unsaved-changes guard
    router.push('/admin/work');
  }

  /* ─── Derived ─── */

  const sectionWords = useMemo(
    () => Object.fromEntries(PROJECT_SECTIONS.map((s) => [s.key, wordCount(draft[s.key])])) as Record<ProjectSectionKey, number>,
    [draft]
  );
  const requirements = [
    { label: 'Title', ok: !!draft.title.trim(), target: 'project-title' },
    { label: 'One-line summary', ok: !!draft.excerpt.trim(), target: 'excerpt' },
    { label: 'Domain', ok: !!draft.domain.trim(), target: 'domain' },
  ];
  const fieldError = (name: string) => error?.field === name;
  const slugChangedWhileLive = !!liveSlug && draft.slug !== liveSlug;

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

  return (
    <div className="min-h-dvh">
      {/* ─── Top bar ─── */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="flex h-12 items-center gap-3 px-3">
          <Link
            href="/admin/work"
            onClick={leave}
            className="label-mono inline-flex h-8 items-center gap-1.5 rounded-[4px] px-2 text-fg-muted hover:bg-surface hover:text-fg"
          >
            <ArrowLeft className="size-3.5" />
            Work
          </Link>
          <StatusPill status={status} />
          <span className={cn('label-mono hidden sm:inline', dirty ? 'text-warn' : 'text-fg-faint')} aria-live="polite">
            {saveState}
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href={`/admin/work/${id}/preview`}
              target="_blank"
              title="Full-page preview"
              className="hidden size-8 items-center justify-center rounded-[4px] text-fg-muted hover:bg-surface hover:text-fg sm:flex"
            >
              <Eye className="size-4" />
            </Link>
            {liveSlug && (
              <a
                href={`/work/${liveSlug}`}
                target="_blank"
                className="label-mono hidden h-8 items-center gap-1 rounded-[4px] px-2 text-fg-muted hover:bg-surface hover:text-fg md:inline-flex"
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
                  className={buttonStyles({ variant: 'ghost', size: 'sm' })}
                >
                  Unpublish
                </button>
                <button
                  type="button"
                  onClick={() => save('save')}
                  disabled={!!pending || !dirty}
                  title="Update the live case study (Ctrl/⌘ S)"
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
        </div>

        {recovery && (
          <div className="flex flex-wrap items-center gap-3 border-t border-warn/30 bg-warn/10 px-4 py-2 text-sm">
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
          <div role="alert" className="flex flex-wrap items-center gap-3 border-t border-danger/30 bg-danger/10 px-4 py-2 text-sm">
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
          <div role="status" className="flex items-center gap-3 border-t border-signal-ink/30 bg-signal/10 px-4 py-2 text-sm">
            <span className="size-1.5 bg-signal" />
            <span className="text-fg">{notice.message}</span>
            {notice.href && (
              <a href={notice.href} target="_blank" className="label-mono inline-flex items-center gap-1 text-fg link-underline">
                {notice.href} <ArrowUpRight className="size-3" />
              </a>
            )}
          </div>
        )}
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <main className="min-w-0 space-y-10">
          <textarea
            id="project-title"
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
            placeholder="Project name"
            aria-label="Project name"
            aria-invalid={fieldError('title')}
            className={cn(
              'w-full resize-none scroll-mt-24 bg-transparent text-[clamp(1.6rem,3vw,2.4rem)] leading-tight font-medium tracking-[-0.03em] text-fg outline-none [field-sizing:content] placeholder:text-fg-faint',
              fieldError('title') && 'text-danger'
            )}
          />

          <Group title="Overview" description="Shown in the project list and at the top of the case study.">
            <div>
              <Label
                htmlFor="excerpt"
                aside={
                  <span className={cn('normal-case tracking-normal', draft.excerpt.length > EXCERPT_MAX && 'text-danger')}>
                    {draft.excerpt.length}/{EXCERPT_MAX}
                  </span>
                }
              >
                One-line summary
              </Label>
              <textarea
                id="excerpt"
                rows={2}
                value={draft.excerpt}
                onChange={(e) => set('excerpt', e.target.value)}
                placeholder="What it is and the result, in a sentence or two."
                className={cn(field(fieldError('excerpt')), 'scroll-mt-24 resize-y leading-relaxed [field-sizing:content]')}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_10rem]">
              <div>
                <Label htmlFor="domain">Domain</Label>
                <input
                  id="domain"
                  list="project-domains"
                  value={draft.domain}
                  onChange={(e) => set('domain', e.target.value)}
                  placeholder="e.g. AI / NLP"
                  className={cn(field(fieldError('domain')), 'scroll-mt-24')}
                />
                <datalist id="project-domains">
                  {domains.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
                <p className="mt-1.5 text-[12px] text-fg-faint">
                  The part before the first “/” becomes the filter on /work.
                </p>
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <input
                  id="year"
                  value={draft.year}
                  onChange={(e) => set('year', e.target.value)}
                  placeholder="2025–2026"
                  className={cn(field(fieldError('year')), 'font-mono text-[13px]')}
                />
              </div>
            </div>

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
              <div className={cn(field(fieldError('slug')), 'flex items-center p-0')}>
                <span className="pl-3 font-mono text-[12px] text-fg-faint">/work/</span>
                <input
                  id="slug"
                  value={draft.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                  }}
                  onBlur={() => set('slug', slugify(draft.slug) || slugify(draft.title) || placeholderSlug || project.slug)}
                  className="min-w-0 flex-1 bg-transparent py-2 pr-3 font-mono text-[12.5px] text-fg outline-none"
                />
              </div>
              {slugChangedWhileLive && (
                <p className="mt-2 text-[12px] text-warn">
                  This project is live at /work/{liveSlug}. Changing the URL breaks existing links to it.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="technologies">Tech stack</Label>
              <TagInput
                id="technologies"
                value={draft.technologies}
                onChange={(t) => set('technologies', t)}
                suggestions={techSuggestions}
                max={30}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="githubUrl">Source code (optional)</Label>
                <input
                  id="githubUrl"
                  value={draft.githubUrl}
                  onChange={(e) => set('githubUrl', e.target.value)}
                  placeholder="https://github.com/…"
                  className={cn(field(fieldError('githubUrl')), 'font-mono text-[12.5px]')}
                />
              </div>
              <div>
                <Label htmlFor="liveUrl">Live demo (optional)</Label>
                <input
                  id="liveUrl"
                  value={draft.liveUrl}
                  onChange={(e) => set('liveUrl', e.target.value)}
                  placeholder="https://…"
                  className={cn(field(fieldError('liveUrl')), 'font-mono text-[12.5px]')}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start justify-between gap-4">
              <span>
                <span className="block text-sm text-fg">Show on the home page</span>
                <span className="block text-[12px] text-fg-faint">Adds it to “Selected work”.</span>
              </span>
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => set('featured', e.target.checked)}
                className="peer sr-only"
              />
              <span className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-surface-2 transition-colors peer-checked:bg-signal peer-focus-visible:outline-2 peer-focus-visible:outline-signal-ink after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-fg after:transition-transform peer-checked:after:translate-x-4 peer-checked:after:bg-on-signal" />
            </label>
          </Group>

          <Group
            title="Metrics"
            description="Headline numbers, shown as a datasheet on the case study. The first three also appear in project lists."
          >
            <div className="space-y-2" id="metrics">
              {draft.metrics.length > 0 && (
                <div className="label-mono grid grid-cols-[minmax(0,12rem)_minmax(0,1fr)_2rem] gap-2 text-fg-faint">
                  <span>Name</span>
                  <span>Value</span>
                </div>
              )}
              {draft.metrics.map((m, i) => (
                <div key={i} className="grid grid-cols-[minmax(0,12rem)_minmax(0,1fr)_2rem] gap-2">
                  <input
                    aria-label={`Metric ${i + 1} name`}
                    value={m.key}
                    placeholder="accuracy"
                    onChange={(e) =>
                      set('metrics', draft.metrics.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))
                    }
                    className={cn(field(fieldError('metrics')), 'font-mono text-[12.5px]')}
                  />
                  <input
                    aria-label={`Metric ${i + 1} value`}
                    value={m.value}
                    placeholder="1.6 m"
                    onChange={(e) =>
                      set('metrics', draft.metrics.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                    }
                    className={cn(field(fieldError('metrics')), 'font-mono text-[12.5px]')}
                  />
                  <button
                    type="button"
                    aria-label={`Remove metric ${i + 1}`}
                    onClick={() => set('metrics', draft.metrics.filter((_, j) => j !== i))}
                    className="flex items-center justify-center rounded-[4px] text-fg-faint hover:bg-surface hover:text-danger"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={draft.metrics.length >= METRIC_MAX}
                onClick={() => set('metrics', [...draft.metrics, { key: '', value: '' }])}
                className={cn(buttonStyles({ variant: 'ghost', size: 'sm' }), '-ml-2')}
              >
                <Plus className="size-4" />
                Add metric
              </button>
            </div>
          </Group>

          <Group title="Case study" description="Each section is Markdown. Empty sections are hidden on the page.">
            {PROJECT_SECTIONS.map((s) => (
              <SectionField
                key={s.key}
                sectionKey={s.key}
                label={s.label}
                hint={s.hint}
                value={draft[s.key]}
                invalid={fieldError(s.key)}
                onChange={(v) => set(s.key, v)}
              />
            ))}
          </Group>

          <div className="border-t border-line pt-6">
            {confirmDelete ? (
              <div className="space-y-2">
                <p className="text-sm text-fg">
                  Delete this project permanently?{status === 'PUBLISHED' && ' It will disappear from the site.'}
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
              <button type="button" onClick={() => setConfirmDelete(true)} className="label-mono text-fg-faint hover:text-danger">
                Delete project
              </button>
            )}
          </div>
        </main>

        <aside className="hidden lg:block" aria-label="Outline">
          <div className="sticky top-20 space-y-8">
            <div>
              <p className="label-mono text-fg-faint">Needed to publish</p>
              <ul className="mt-3 space-y-1.5">
                {requirements.map((r) => (
                  <li key={r.label}>
                    <button
                      type="button"
                      onClick={() => document.getElementById(r.target)?.focus()}
                      className={cn('flex items-center gap-2 text-[13px]', r.ok ? 'text-fg-muted' : 'text-fg hover:text-signal-ink')}
                    >
                      {r.ok ? (
                        <Check className="size-3.5 text-signal-ink" />
                      ) : (
                        <span className="size-3.5 rounded-full border border-fg-faint" />
                      )}
                      {r.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="label-mono text-fg-faint">Case study</p>
              <ol className="mt-3 space-y-0.5 border-l border-line">
                {PROJECT_SECTIONS.map((s) => (
                  <li key={s.key}>
                    <a
                      href={`#section-${s.key}-block`}
                      className="-ml-px flex items-center justify-between gap-2 border-l border-transparent py-1 pl-3 text-[13px] text-fg-muted hover:border-fg-faint hover:text-fg"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className={cn('size-1.5 shrink-0', sectionWords[s.key] ? 'bg-signal' : 'border border-fg-faint')} />
                        <span className="truncate">{s.label}</span>
                      </span>
                      <span className="font-mono text-[10.5px] text-fg-faint">{sectionWords[s.key] || ''}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
