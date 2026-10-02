'use client';

import { useOptimistic, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, FileText, Pencil, Radio, Trash2, Upload } from 'lucide-react';
import { deleteResume, renameResume, setLiveResume, type ResumeResult } from '@/app/admin/resume-actions';
import { buttonStyles } from '@/components/ui/button';
import type { AdminResume } from '@/lib/types';
import { cn } from '@/lib/utils';

const MAX_BYTES = 4 * 1024 * 1024;

type Op = { type: 'live'; id: string | null } | { type: 'remove'; id: string };

function applyOp(list: AdminResume[], op: Op): AdminResume[] {
  switch (op.type) {
    case 'live':
      return list.map((r) => ({ ...r, active: r.id === op.id }));
    case 'remove':
      return list.filter((r) => r.id !== op.id);
  }
}

const input = (invalid?: boolean) =>
  cn(
    'w-full rounded-[4px] border bg-surface/40 px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-fg-faint',
    invalid ? 'border-danger/70' : 'border-line'
  );

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function UploadResume({ first }: { first: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [live, setLive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pick(f: File | null) {
    setError(null);
    setDone(null);
    if (!f) return setFile(null);
    if (f.type && f.type !== 'application/pdf') return setError('Choose a PDF file.');
    if (f.size > MAX_BYTES) return setError('PDFs must be 4 MB or smaller.');
    setFile(f);
    if (!label.trim()) setLabel(f.name.replace(/\.pdf$/i, ''));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || pending) return;
    const body = new FormData();
    body.set('file', file);
    body.set('label', label.trim());
    if (live) body.set('live', '1');

    startTransition(async () => {
      const res = await fetch('/api/admin/resumes', { method: 'POST', body }).catch(() => null);
      const data = (await res?.json().catch(() => null)) as { error?: string } | null;
      if (!res?.ok) {
        setError(data?.error ?? 'Upload failed. Try again.');
        return;
      }
      setDone(live ? `Uploaded “${label.trim() || file.name}” — it’s now the live résumé.` : `Uploaded “${label.trim() || file.name}”.`);
      setFile(null);
      setLabel('');
      setLive(true);
      if (fileRef.current) fileRef.current.value = '';
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-5 border border-line p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <label htmlFor="resume-file" className="label-mono mb-1.5 block text-fg-faint">
          PDF file
        </label>
        <label
          htmlFor="resume-file"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pick(e.dataTransfer.files?.[0] ?? null);
          }}
          className={cn(
            'flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-[4px] border border-dashed px-4 py-5 text-center transition-colors hover:border-fg-faint',
            file ? 'border-signal-ink/60 bg-surface/40' : 'border-border'
          )}
        >
          <FileText className="size-5 text-fg-faint" />
          {file ? (
            <span className="text-sm text-fg">
              {file.name} <span className="font-mono text-[12px] text-fg-faint">· {formatSize(file.size)}</span>
            </span>
          ) : (
            <span className="text-sm text-fg-muted">Drop a PDF here or click to choose · max 4 MB</span>
          )}
        </label>
        <input
          ref={fileRef}
          id="resume-file"
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="resume-label" className="label-mono mb-1.5 block text-fg-faint">
            Label (only you see this)
          </label>
          <input
            id="resume-label"
            value={label}
            maxLength={120}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. SWE — Oct 2026"
            className={input()}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-fg-muted">
          <input
            type="checkbox"
            checked={live}
            onChange={(e) => setLive(e.target.checked)}
            className="size-4 accent-[var(--signal-ink)]"
          />
          {first ? 'Make it live — visitors download it from /resume' : 'Make it live — replaces the current live résumé'}
        </label>
        <div className="mt-auto flex items-center gap-3">
          <button type="submit" disabled={!file || pending} className={cn(buttonStyles({ variant: 'primary' }), 'ml-auto')}>
            <Upload className="size-4" />
            {pending ? 'Uploading…' : 'Upload'}
          </button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {done && (
          <p role="status" className="text-sm text-signal-ink">
            {done}
          </p>
        )}
      </div>
    </form>
  );
}

function RenameForm({
  resume,
  onSave,
  onCancel,
}: {
  resume: AdminResume;
  onSave: (label: string) => Promise<ResumeResult>;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(resume.label);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-wrap items-center gap-2 border-l-2 border-signal-ink bg-surface/40 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await onSave(label);
          if (res.ok) onCancel();
          else setError(res.error);
        });
      }}
    >
      <input
        aria-label="Label"
        value={label}
        maxLength={120}
        autoFocus
        onChange={(e) => setLabel(e.target.value)}
        className={cn(input(!!error), 'max-w-md flex-1')}
      />
      <button type="submit" disabled={pending} className={buttonStyles({ variant: 'primary', size: 'sm' })}>
        {pending ? 'Saving…' : 'Save'}
      </button>
      <button type="button" onClick={onCancel} className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
        Cancel
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex size-8 items-center justify-center rounded-[4px] text-fg-faint transition-colors',
        danger ? 'hover:bg-danger/10 hover:text-danger' : 'hover:bg-surface hover:text-fg'
      )}
    >
      {children}
    </button>
  );
}

export function ResumeManager({ resumes, fallback }: { resumes: AdminResume[]; fallback: string }) {
  const [list, apply] = useOptimistic(resumes, applyOp);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const live = list.find((r) => r.active);

  function run(op: Op, action: () => Promise<ResumeResult>) {
    setError(null);
    startTransition(async () => {
      apply(op);
      const res = await action();
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="space-y-12">
      <section aria-label="Upload a résumé">
        <h2 className="label-mono mb-3 text-fg-faint">Upload a résumé</h2>
        <UploadResume first={list.length === 0} />
      </section>

      <section aria-label="Uploaded résumés">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
          <h2 className="label-mono text-fg-faint">
            Uploaded · {list.length} {list.length === 1 ? 'version' : 'versions'}
          </h2>
          <p className="label-mono text-fg-faint" aria-live="polite">
            {pending ? 'Saving…' : 'Pick which version is live'}
          </p>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}

        {list.length === 0 ? (
          <p className="py-16 text-center text-sm text-fg-muted">
            No résumés uploaded yet. Until you upload one, /resume serves the bundled file{' '}
            <span className="font-mono text-[12.5px]">{fallback}</span>.
          </p>
        ) : (
          <ol>
            {list.map((r) => (
              <li key={r.id} className="border-b border-line py-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="radio"
                      name="live-resume"
                      checked={r.active}
                      onChange={() => run({ type: 'live', id: r.id }, () => setLiveResume(r.id))}
                      className="size-4 shrink-0 accent-[var(--signal-ink)]"
                      aria-label={`Make “${r.label}” the live résumé`}
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium text-fg">{r.label}</span>
                        {r.active && (
                          <span className="label-mono shrink-0 bg-signal px-1.5 py-0.5 text-on-signal">Live</span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[11.5px] text-fg-faint">
                        {r.fileName} · {formatSize(r.size)} · uploaded {formatDate(r.createdAt)}
                      </span>
                    </span>
                  </label>

                  <div className="flex items-center gap-0.5">
                    <a
                      href={`/api/admin/resumes/${r.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open PDF"
                      aria-label="Open PDF"
                      className="flex size-8 items-center justify-center rounded-[4px] text-fg-faint hover:bg-surface hover:text-fg"
                    >
                      <ArrowUpRight className="size-3.5" />
                    </a>
                    <IconButton label="Rename" onClick={() => setRenaming(renaming === r.id ? null : r.id)}>
                      <Pencil className="size-3.5" />
                    </IconButton>
                    {confirming === r.id ? (
                      <span className="flex items-center gap-1 pl-1">
                        <button
                          type="button"
                          onClick={() => {
                            setConfirming(null);
                            run({ type: 'remove', id: r.id }, () => deleteResume(r.id));
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
                      <IconButton label="Delete" danger onClick={() => setConfirming(r.id)}>
                        <Trash2 className="size-3.5" />
                      </IconButton>
                    )}
                  </div>
                </div>

                {confirming === r.id && r.active && (
                  <p className="mt-2 text-[13px] text-warn">
                    This is the live résumé. Deleting it makes /resume fall back to the bundled file.
                  </p>
                )}
                {renaming === r.id && (
                  <div className="mt-3">
                    <RenameForm
                      resume={r}
                      onCancel={() => setRenaming(null)}
                      onSave={(label) => renameResume(r.id, label)}
                    />
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px] text-fg-muted">
          <p>
            {live ? (
              <>
                Live: <span className="text-fg">{live.label}</span>
              </>
            ) : (
              list.length > 0 && <>No version is live, so /resume serves the bundled file.</>
            )}
          </p>
          {live && (
            <button
              type="button"
              onClick={() => run({ type: 'live', id: null }, () => setLiveResume(null))}
              className="inline-flex items-center gap-1.5 text-fg-faint hover:text-fg"
            >
              <Radio className="size-3.5" />
              Use the bundled file instead
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
