'use client';

import { useOptimistic, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronDown, ChevronUp, GripVertical, Pencil, Star, Trash2 } from 'lucide-react';
import {
  deleteProject,
  reorderProjects,
  setProjectFeatured,
  type ProjectListResult,
} from '@/app/admin/project-actions';
import { StatusPill } from '@/components/admin/article-table';
import type { AdminProject } from '@/lib/types';
import { cn, timeAgo } from '@/lib/utils';

type Op =
  | { type: 'reorder'; ids: string[] }
  | { type: 'featured'; id: string; featured: boolean }
  | { type: 'remove'; id: string };

function applyOp(list: AdminProject[], op: Op): AdminProject[] {
  switch (op.type) {
    case 'reorder': {
      const byId = new Map(list.map((p) => [p.id, p]));
      return op.ids.flatMap((id) => byId.get(id) ?? []);
    }
    case 'featured':
      return list.map((p) => (p.id === op.id ? { ...p, featured: op.featured } : p));
    case 'remove':
      return list.filter((p) => p.id !== op.id);
  }
}

const iconButton =
  'flex size-8 items-center justify-center rounded-[4px] text-fg-faint transition-colors hover:bg-surface hover:text-fg disabled:pointer-events-none disabled:opacity-30';

export function ProjectManager({ projects }: { projects: AdminProject[] }) {
  const [list, apply] = useOptimistic(projects, applyOp);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; over: string | null } | null>(null);

  function run(op: Op, action: () => Promise<ProjectListResult>) {
    setError(null);
    startTransition(async () => {
      apply(op);
      const res = await action();
      if (!res.ok) setError(res.error);
    });
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= list.length) return;
    const ids = list.map((p) => p.id);
    const [item] = ids.splice(from, 1);
    ids.splice(to, 0, item);
    run({ type: 'reorder', ids }, () => reorderProjects(ids));
  }

  const live = list.filter((p) => p.status === 'PUBLISHED').length;

  return (
    <section aria-label="Projects">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
        <h2 className="label-mono text-fg-faint">
          {list.length} projects · {live} live · {list.length - live} drafts
        </h2>
        <p className="label-mono text-fg-faint" aria-live="polite">
          {pending ? 'Saving…' : 'Drag or use the arrows to reorder · ★ shows it on the home page'}
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      {list.length === 0 ? (
        <p className="py-16 text-center text-sm text-fg-muted">No projects yet.</p>
      ) : (
        <ol>
          {list.map((p, i) => {
            const dragIndex = drag ? list.findIndex((x) => x.id === drag.id) : -1;
            const isOver = drag && drag.over === p.id && drag.id !== p.id;
            return (
              <li
                key={p.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', p.id);
                  setDrag({ id: p.id, over: null });
                }}
                onDragOver={(e) => {
                  if (!drag) return;
                  e.preventDefault();
                  if (drag.over !== p.id) setDrag({ ...drag, over: p.id });
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (drag) move(dragIndex, i);
                  setDrag(null);
                }}
                onDragEnd={() => setDrag(null)}
                className={cn(
                  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-line py-3.5 transition-opacity sm:grid-cols-[1rem_1.75rem_minmax(0,1fr)_5rem_auto]',
                  drag?.id === p.id && 'opacity-40',
                  isOver &&
                    (dragIndex < i
                      ? 'shadow-[inset_0_-2px_0_var(--signal-ink)]'
                      : 'shadow-[inset_0_2px_0_var(--signal-ink)]')
                )}
              >
                <GripVertical className="hidden size-4 cursor-grab text-fg-faint sm:block" aria-hidden />
                <span className="hidden font-mono text-[11px] text-fg-faint sm:block">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <div className="min-w-0">
                  <Link href={`/admin/work/${p.id}`} className="font-medium text-fg hover:text-signal-ink">
                    {p.title || 'Untitled project'}
                  </Link>
                  <p className="mt-1 truncate font-mono text-[11.5px] text-fg-faint">
                    /work/{p.slug}
                    {p.domain && ` · ${p.domain}`}
                    {p.year && ` · ${p.year}`}
                    {' · '}edited {timeAgo(p.updatedAt)}
                  </p>
                </div>

                <div className="hidden sm:block">
                  <StatusPill status={p.status} />
                </div>

                <div className="flex items-center justify-end gap-0.5">
                  <button
                    type="button"
                    className={iconButton}
                    title={p.featured ? 'Remove from Selected work on the home page' : 'Show in Selected work on the home page'}
                    aria-label={p.featured ? 'Remove from home page' : 'Show on home page'}
                    aria-pressed={p.featured}
                    onClick={() =>
                      run({ type: 'featured', id: p.id, featured: !p.featured }, () =>
                        setProjectFeatured(p.id, !p.featured)
                      )
                    }
                  >
                    <Star className={cn('size-3.5', p.featured && 'fill-signal text-signal-ink')} />
                  </button>
                  <button type="button" className={iconButton} aria-label="Move up" title="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}>
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    className={iconButton}
                    aria-label="Move down"
                    title="Move down"
                    disabled={i === list.length - 1}
                    onClick={() => move(i, i + 1)}
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <Link href={`/admin/work/${p.id}`} className={iconButton} aria-label="Edit" title="Edit">
                    <Pencil className="size-3.5" />
                  </Link>
                  {p.status === 'PUBLISHED' && (
                    <a href={`/work/${p.slug}`} target="_blank" className={iconButton} aria-label="Open live page" title="Open live page">
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  )}
                  {confirming === p.id ? (
                    <span className="flex items-center gap-1 pl-1">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirming(null);
                          run({ type: 'remove', id: p.id }, () => deleteProject(p.id));
                        }}
                        className="label-mono rounded-[3px] bg-danger px-2 py-1.5 text-white"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(null)}
                        className="label-mono rounded-[3px] px-2 py-1.5 text-fg-muted hover:text-fg"
                      >
                        Keep
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={cn(iconButton, 'hover:bg-danger/10 hover:text-danger')}
                      aria-label="Delete"
                      title="Delete"
                      onClick={() => setConfirming(p.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
