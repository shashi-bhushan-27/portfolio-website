'use client';

import { useMemo, useOptimistic, useRef, useState, useTransition } from 'react';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import {
  addVideo,
  deleteVideo,
  lookupYouTube,
  reorderVideos,
  setFeaturedVideo,
  updateVideo,
  type VideoInput,
  type VideoResult,
} from '@/app/admin/video-actions';
import { buttonStyles } from '@/components/ui/button';
import { parseYouTubeId, youtubeThumbnail, youtubeWatchUrl } from '@/lib/youtube';
import type { AdminVideo } from '@/lib/types';
import { cn } from '@/lib/utils';

type Fields = Omit<VideoInput, 'featured'>;
type FieldError = { message: string; field?: keyof VideoInput } | null;

type Op =
  | { type: 'reorder'; ids: string[] }
  | { type: 'feature'; id: string | null }
  | { type: 'remove'; id: string }
  | { type: 'update'; id: string; patch: Partial<AdminVideo> };

function applyOp(list: AdminVideo[], op: Op): AdminVideo[] {
  switch (op.type) {
    case 'reorder': {
      const byId = new Map(list.map((v) => [v.id, v]));
      return op.ids.flatMap((id) => byId.get(id) ?? []);
    }
    case 'feature':
      return list.map((v) => ({ ...v, featured: v.id === op.id }));
    case 'remove':
      return list.filter((v) => v.id !== op.id);
    case 'update':
      return list.map((v) => (v.id === op.id ? { ...v, ...op.patch } : v));
  }
}

const input = (invalid?: boolean) =>
  cn(
    'w-full rounded-[4px] border bg-surface/40 px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-fg-faint',
    invalid ? 'border-danger/70' : 'border-line'
  );

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={cn('label-mono mb-1.5 block', error ? 'text-danger' : 'text-fg-faint')}>
        {label}
      </label>
      {children}
    </div>
  );
}

/** Title / category / description inputs shared by the add panel and inline editing. */
function DetailFields({
  prefix,
  value,
  onChange,
  error,
}: {
  prefix: string;
  value: Fields;
  onChange: (patch: Partial<Fields>) => void;
  error: FieldError;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <Field id={`${prefix}-title`} label="Title" error={error?.field === 'title'}>
          <input
            id={`${prefix}-title`}
            value={value.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className={input(error?.field === 'title')}
          />
        </Field>
        <Field id={`${prefix}-category`} label="Category" error={error?.field === 'category'}>
          <input
            id={`${prefix}-category`}
            list="video-categories"
            value={value.category}
            onChange={(e) => onChange({ category: e.target.value })}
            placeholder="e.g. Distributed Systems"
            className={input(error?.field === 'category')}
          />
        </Field>
      </div>
      <Field id={`${prefix}-description`} label="Description (optional)" error={error?.field === 'description'}>
        <textarea
          id={`${prefix}-description`}
          rows={2}
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="One or two sentences shown under the video."
          className={cn(input(error?.field === 'description'), 'resize-y leading-relaxed')}
        />
      </Field>
    </>
  );
}

type Lookup =
  | { state: 'idle' }
  | { state: 'loading'; id: string }
  | { state: 'found'; id: string; author: string }
  | { state: 'missing'; id: string; error: string };

const EMPTY: Fields = { url: '', title: '', description: '', category: '' };

function AddVideo({ existing }: { existing: Set<string> }) {
  const [form, setForm] = useState<Fields>(EMPTY);
  const [featured, setFeatured] = useState(false);
  const [lookup, setLookup] = useState<Lookup>({ state: 'idle' });
  const [error, setError] = useState<FieldError>(null);
  const [added, setAdded] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const id = parseYouTubeId(form.url);
  const duplicate = !!id && existing.has(id);
  const canAdd = !!id && !duplicate && !!form.title.trim() && !!form.category.trim() && !pending;

  function onUrl(value: string) {
    setForm((f) => ({ ...f, url: value }));
    setError(null);
    setAdded(null);
    clearTimeout(timer.current);
    const next = parseYouTubeId(value);
    if (!next || existing.has(next)) {
      setLookup({ state: 'idle' });
      return;
    }
    setLookup({ state: 'loading', id: next });
    timer.current = setTimeout(async () => {
      const res = await lookupYouTube(next);
      setLookup((cur) =>
        cur.state === 'loading' && cur.id === next
          ? res.ok
            ? { state: 'found', id: next, author: res.author }
            : { state: 'missing', id: next, error: res.error }
          : cur
      );
      // Prefill the title from YouTube unless one was already typed.
      if (res.ok && res.title) {
        setForm((f) => (parseYouTubeId(f.url) === next && !f.title.trim() ? { ...f, title: res.title } : f));
      }
    }, 300);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canAdd) return;
    startTransition(async () => {
      const res = await addVideo({ ...form, featured });
      if (!res.ok) {
        setError({ message: res.error, field: res.field });
        return;
      }
      setAdded(form.title.trim());
      setForm(EMPTY);
      setFeatured(false);
      setLookup({ state: 'idle' });
    });
  }

  let status: { tone: 'muted' | 'ok' | 'warn' | 'danger'; text: string };
  if (!form.url.trim()) status = { tone: 'muted', text: 'Paste a link like youtu.be/… or youtube.com/watch?v=…' };
  else if (!id) status = { tone: 'danger', text: 'That isn’t a YouTube link or video ID.' };
  else if (duplicate) status = { tone: 'warn', text: 'This video is already on the site.' };
  else if (lookup.state === 'loading') status = { tone: 'muted', text: 'Looking it up on YouTube…' };
  else if (lookup.state === 'found') status = { tone: 'ok', text: `Found on YouTube${lookup.author ? ` · ${lookup.author}` : ''}` };
  else if (lookup.state === 'missing') status = { tone: 'warn', text: lookup.error };
  else status = { tone: 'muted', text: `Video ID ${id}` };

  return (
    <form onSubmit={submit} className="grid gap-6 border border-line p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="space-y-4">
        <div>
          <Field id="add-url" label="YouTube link" error={error?.field === 'url'}>
            <input
              id="add-url"
              value={form.url}
              onChange={(e) => onUrl(e.target.value)}
              placeholder="https://youtu.be/…"
              autoComplete="off"
              spellCheck={false}
              className={cn(input(error?.field === 'url'), 'font-mono text-[13px]')}
            />
          </Field>
          <p
            aria-live="polite"
            className={cn(
              'mt-1.5 text-[12px]',
              status.tone === 'ok' && 'text-signal-ink',
              status.tone === 'warn' && 'text-warn',
              status.tone === 'danger' && 'text-danger',
              status.tone === 'muted' && 'text-fg-faint'
            )}
          >
            {status.text}
          </p>
        </div>

        <DetailFields prefix="add" value={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} error={error} />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-fg-muted">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="size-4 accent-[var(--signal-ink)]"
            />
            Feature it — the big player at the top of /videos
          </label>
          <button type="submit" disabled={!canAdd} className={cn(buttonStyles({ variant: 'primary' }), 'ml-auto')}>
            <Plus className="size-4" />
            {pending ? 'Adding…' : 'Add to site'}
          </button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error.message}
          </p>
        )}
        {added && (
          <p role="status" className="text-sm text-signal-ink">
            Added “{added}” — it’s live on /videos.
          </p>
        )}
      </div>

      <div className="order-first lg:order-none">
        <div className="relative aspect-video overflow-hidden border border-line bg-surface">
          {id ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={youtubeThumbnail(id)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="label-mono absolute inset-0 grid place-items-center text-fg-faint">Preview</span>
          )}
        </div>
      </div>
    </form>
  );
}

function EditVideo({
  video,
  onSave,
  onCancel,
}: {
  video: AdminVideo;
  onSave: (fields: Fields) => Promise<VideoResult>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Fields>({
    url: youtubeWatchUrl(video.youtubeId),
    title: video.title,
    description: video.description,
    category: video.category,
  });
  const [error, setError] = useState<FieldError>(null);
  const [pending, startTransition] = useTransition();
  const prefix = `edit-${video.id}`;

  return (
    <form
      className="space-y-4 border-l-2 border-signal-ink bg-surface/40 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await onSave(form);
          if (res.ok) onCancel();
          else setError({ message: res.error, field: res.field });
        });
      }}
    >
      <Field id={`${prefix}-url`} label="YouTube link" error={error?.field === 'url'}>
        <input
          id={`${prefix}-url`}
          value={form.url}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
          spellCheck={false}
          className={cn(input(error?.field === 'url'), 'font-mono text-[13px]')}
        />
      </Field>
      <DetailFields prefix={prefix} value={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} error={error} />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error.message}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={buttonStyles({ variant: 'primary', size: 'sm' })}>
          {pending ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  pressed,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex size-8 items-center justify-center rounded-[4px] text-fg-faint transition-colors disabled:pointer-events-none disabled:opacity-30',
        danger ? 'hover:bg-danger/10 hover:text-danger' : 'hover:bg-surface hover:text-fg'
      )}
    >
      {children}
    </button>
  );
}

export function VideoManager({ videos, categories }: { videos: AdminVideo[]; categories: string[] }) {
  const [list, apply] = useOptimistic(videos, applyOp);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; over: string | null } | null>(null);

  const existing = useMemo(() => new Set(videos.map((v) => v.youtubeId)), [videos]);
  // Mirrors the public page: the first starred video gets the big player, else the first in order.
  // (Older data can have several starred; starring any video clears the rest.)
  const featured = list.find((v) => v.featured);
  const leadId = featured?.id ?? list[0]?.id;

  function run(op: Op, action: () => Promise<VideoResult>) {
    setError(null);
    startTransition(async () => {
      apply(op);
      const res = await action();
      if (!res.ok) setError(res.error);
    });
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= list.length) return;
    const ids = list.map((v) => v.id);
    const [item] = ids.splice(from, 1);
    ids.splice(to, 0, item);
    run({ type: 'reorder', ids }, () => reorderVideos(ids));
  }

  return (
    <div className="space-y-12">
      <datalist id="video-categories">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <section aria-label="Add a video">
        <h2 className="label-mono mb-3 text-fg-faint">Add a video</h2>
        <AddVideo existing={existing} />
      </section>

      <section aria-label="Videos on the site">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
          <h2 className="label-mono text-fg-faint">
            On the site · {list.length} {list.length === 1 ? 'video' : 'videos'}
          </h2>
          <p className="label-mono text-fg-faint" aria-live="polite">
            {pending ? 'Saving…' : 'Drag or use the arrows to reorder · ★ picks the big player'}
          </p>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}

        {list.length === 0 ? (
          <p className="py-16 text-center text-sm text-fg-muted">No videos yet. Paste a YouTube link above.</p>
        ) : (
          <ol>
            {list.map((v, i) => {
              const isLead = v.id === leadId;
              const starred = isLead && v.featured;
              const isDragging = drag?.id === v.id;
              const isOver = drag && drag.over === v.id && drag.id !== v.id;
              const dragIndex = drag ? list.findIndex((x) => x.id === drag.id) : -1;
              return (
                <li
                  key={v.id}
                  draggable={editing !== v.id}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', v.id);
                    setDrag({ id: v.id, over: null });
                  }}
                  onDragOver={(e) => {
                    if (!drag) return;
                    e.preventDefault();
                    if (drag.over !== v.id) setDrag({ ...drag, over: v.id });
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (drag) move(dragIndex, i);
                    setDrag(null);
                  }}
                  onDragEnd={() => setDrag(null)}
                  className={cn(
                    'relative grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 border-b border-line py-3 transition-opacity sm:grid-cols-[1rem_8.5rem_minmax(0,1fr)_auto]',
                    isDragging && 'opacity-40',
                    isOver && (dragIndex < i ? 'shadow-[inset_0_-2px_0_var(--signal-ink)]' : 'shadow-[inset_0_2px_0_var(--signal-ink)]')
                  )}
                >
                  <GripVertical className="hidden size-4 cursor-grab text-fg-faint sm:block" aria-hidden />

                  <div className="relative aspect-video overflow-hidden border border-line bg-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={youtubeThumbnail(v.youtubeId, 'mq')} alt="" loading="lazy" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
                    {isLead && (
                      <span className="label-mono absolute top-1 left-1 bg-signal px-1 text-on-signal">Big player</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium text-fg">{v.title}</p>
                    <p className="mt-1 truncate font-mono text-[11.5px] text-fg-faint">
                      #{i + 1} · {v.youtubeId} · {v.category}
                    </p>
                    {v.description && (
                      <p className="mt-1 line-clamp-1 text-[13px] text-fg-muted">{v.description}</p>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-0.5 sm:col-span-1">
                    <IconButton
                      label={starred ? 'Unstar (the first video in the list takes the big player)' : 'Star: show in the big player'}
                      pressed={starred}
                      onClick={() =>
                        run({ type: 'feature', id: starred ? null : v.id }, () =>
                          setFeaturedVideo(starred ? null : v.id)
                        )
                      }
                    >
                      <Star className={cn('size-3.5', starred && 'fill-signal text-signal-ink')} />
                    </IconButton>
                    <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}>
                      <ChevronUp className="size-4" />
                    </IconButton>
                    <IconButton label="Move down" disabled={i === list.length - 1} onClick={() => move(i, i + 1)}>
                      <ChevronDown className="size-4" />
                    </IconButton>
                    <IconButton label="Edit" pressed={editing === v.id} onClick={() => setEditing(editing === v.id ? null : v.id)}>
                      <Pencil className="size-3.5" />
                    </IconButton>
                    <a
                      href={youtubeWatchUrl(v.youtubeId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open on YouTube"
                      aria-label="Open on YouTube"
                      className="flex size-8 items-center justify-center rounded-[4px] text-fg-faint hover:bg-surface hover:text-fg"
                    >
                      <ArrowUpRight className="size-3.5" />
                    </a>
                    {confirming === v.id ? (
                      <span className="flex items-center gap-1 pl-1">
                        <button
                          type="button"
                          onClick={() => {
                            setConfirming(null);
                            run({ type: 'remove', id: v.id }, () => deleteVideo(v.id));
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
                      <IconButton label="Delete" danger onClick={() => setConfirming(v.id)}>
                        <Trash2 className="size-3.5" />
                      </IconButton>
                    )}
                  </div>

                  {editing === v.id && (
                    <div className="col-span-2 sm:col-span-4">
                      <EditVideo
                        video={v}
                        onCancel={() => setEditing(null)}
                        onSave={(fields) => updateVideo(v.id, fields)}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        {featured ? (
          <p className="mt-4 text-[13px] text-fg-muted">
            Big player: <span className="text-fg">{featured.title}</span>
          </p>
        ) : (
          list.length > 0 && (
            <p className="mt-4 text-[13px] text-fg-muted">
              No video is starred, so the first one in the list gets the big player.
            </p>
          )
        )}
      </section>
    </div>
  );
}
