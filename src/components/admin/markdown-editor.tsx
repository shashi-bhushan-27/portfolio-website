'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  SquareCode,
  Strikethrough,
  Table,
  TextQuote,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Text-editing primitives ───
 * `document.execCommand('insertText')` keeps the browser's native undo stack
 * working inside a textarea; setRangeText is the fallback. */

function insertText(ta: HTMLTextAreaElement, text: string) {
  ta.focus();
  const ok = typeof document.execCommand === 'function' && document.execCommand('insertText', false, text);
  if (!ok) {
    ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function wrap(ta: HTMLTextAreaElement, before: string, after = before, placeholder = 'text') {
  const { selectionStart: s, selectionEnd: e, value } = ta;
  const selected = value.slice(s, e);
  // Toggle off when the selection is already wrapped.
  if (
    selected &&
    value.slice(s - before.length, s) === before &&
    value.slice(e, e + after.length) === after
  ) {
    ta.setSelectionRange(s - before.length, e + after.length);
    insertText(ta, selected);
    ta.setSelectionRange(s - before.length, e - before.length);
    return;
  }
  const inner = selected || placeholder;
  insertText(ta, before + inner + after);
  ta.setSelectionRange(s + before.length, s + before.length + inner.length);
}

function lineRange(ta: HTMLTextAreaElement) {
  const { value, selectionStart, selectionEnd } = ta;
  const start = value.lastIndexOf('\n', selectionStart - 1) + 1;
  let end = value.indexOf('\n', selectionEnd === selectionStart ? selectionEnd : selectionEnd - 1);
  if (end === -1) end = value.length;
  return { start, end, lines: value.slice(start, end).split('\n') };
}

const BLOCK_PREFIX = /^(\s*)(#{1,6}\s|>\s?|[-*+]\s(\[[ xX]\]\s)?|\d+\.\s)/;

function toggleLinePrefix(ta: HTMLTextAreaElement, prefix: (i: number) => string, has: RegExp) {
  const { start, end, lines } = lineRange(ta);
  const all = lines.every((l) => has.test(l) || !l.trim());
  const next = lines.map((l, i) => {
    if (!l.trim()) return l;
    if (all) return l.replace(has, '');
    return prefix(i) + l.replace(BLOCK_PREFIX, '$1');
  });
  const text = next.join('\n');
  ta.setSelectionRange(start, end);
  insertText(ta, text);
  ta.setSelectionRange(start, start + text.length);
}

function insertBlock(ta: HTMLTextAreaElement, block: string, selectFrom?: number, selectLen?: number) {
  const { value, selectionStart } = ta;
  const before = value.slice(0, selectionStart);
  const lead = before === '' || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
  insertText(ta, `${lead}${block}\n`);
  if (selectFrom !== undefined) {
    const at = selectionStart + lead.length + selectFrom;
    ta.setSelectionRange(at, at + (selectLen ?? 0));
  }
}

const actions = {
  h2: (ta: HTMLTextAreaElement) => toggleLinePrefix(ta, () => '## ', /^##\s/),
  h3: (ta: HTMLTextAreaElement) => toggleLinePrefix(ta, () => '### ', /^###\s/),
  bold: (ta: HTMLTextAreaElement) => wrap(ta, '**'),
  italic: (ta: HTMLTextAreaElement) => wrap(ta, '_'),
  strike: (ta: HTMLTextAreaElement) => wrap(ta, '~~'),
  code: (ta: HTMLTextAreaElement) => wrap(ta, '`', '`', 'code'),
  link: (ta: HTMLTextAreaElement) => {
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const selected = value.slice(s, e);
    if (/^https?:\/\/\S+$/.test(selected)) {
      insertText(ta, `[link text](${selected})`);
      ta.setSelectionRange(s + 1, s + 10);
    } else {
      insertText(ta, `[${selected || 'link text'}](https://)`);
      const urlAt = s + (selected || 'link text').length + 3;
      ta.setSelectionRange(urlAt, urlAt + 8);
    }
  },
  quote: (ta: HTMLTextAreaElement) => toggleLinePrefix(ta, () => '> ', /^>\s?/),
  ul: (ta: HTMLTextAreaElement) => toggleLinePrefix(ta, () => '- ', /^[-*+]\s(?!\[)/),
  ol: (ta: HTMLTextAreaElement) => toggleLinePrefix(ta, (i) => `${i + 1}. `, /^\d+\.\s/),
  task: (ta: HTMLTextAreaElement) => toggleLinePrefix(ta, () => '- [ ] ', /^[-*+]\s\[[ xX]\]\s/),
  codeblock: (ta: HTMLTextAreaElement) => {
    const selected = ta.value.slice(ta.selectionStart, ta.selectionEnd);
    insertBlock(ta, '```ts\n' + (selected || '') + '\n```', 3, 2);
  },
  table: (ta: HTMLTextAreaElement) =>
    insertBlock(ta, '| Column | Column |\n| --- | --- |\n| Value | Value |', 2, 6),
  hr: (ta: HTMLTextAreaElement) => insertBlock(ta, '---'),
};

type ActionKey = keyof typeof actions;

const toolbar: ({ key: ActionKey; label: string; icon: React.ComponentType<{ className?: string }>; kbd?: string } | 'sep')[] = [
  { key: 'h2', label: 'Heading', icon: Heading2, kbd: 'Alt 2' },
  { key: 'h3', label: 'Subheading', icon: Heading3, kbd: 'Alt 3' },
  'sep',
  { key: 'bold', label: 'Bold', icon: Bold, kbd: 'Ctrl B' },
  { key: 'italic', label: 'Italic', icon: Italic, kbd: 'Ctrl I' },
  { key: 'strike', label: 'Strikethrough', icon: Strikethrough },
  { key: 'code', label: 'Inline code', icon: Code, kbd: 'Ctrl E' },
  { key: 'link', label: 'Link', icon: LinkIcon, kbd: 'Ctrl K' },
  'sep',
  { key: 'quote', label: 'Quote', icon: TextQuote },
  { key: 'ul', label: 'Bulleted list', icon: List },
  { key: 'ol', label: 'Numbered list', icon: ListOrdered },
  { key: 'task', label: 'Task list', icon: ListChecks },
  'sep',
  { key: 'codeblock', label: 'Code block', icon: SquareCode },
  { key: 'table', label: 'Table', icon: Table },
  { key: 'hr', label: 'Divider', icon: Minus },
];

function altFromFilename(name: string) {
  return name
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/[[\]()]/g, '')
    .trim();
}

export function MarkdownEditor({
  value,
  onChange,
  onUpload,
  onCursor,
  onScrollRatio,
  onError,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onUpload: (file: File) => Promise<string>;
  onCursor?: (pos: { line: number; col: number }) => void;
  onScrollRatio?: (ratio: number) => void;
  onError?: (message: string) => void;
  className?: string;
}) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const latest = useRef(value);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    latest.current = value;
  }, [value]);

  const reportCursor = useCallback(() => {
    const el = ta.current;
    if (!el || !onCursor) return;
    const before = el.value.slice(0, el.selectionStart);
    const line = before.split('\n').length;
    const col = el.selectionStart - before.lastIndexOf('\n');
    onCursor({ line, col });
  }, [onCursor]);

  const upload = useCallback(
    async (files: File[]) => {
      const el = ta.current;
      if (!el) return;
      for (const file of files.filter((f) => f.type.startsWith('image/'))) {
        const token = `![Uploading ${file.name.replace(/[[\]]/g, '')}…]()`;
        insertBlock(el, token);
        setUploading((n) => n + 1);
        try {
          const url = await onUpload(file);
          onChange(latest.current.replace(token, `![${altFromFilename(file.name)}](${url})`));
        } catch (e) {
          onChange(latest.current.replace(`${token}\n`, '').replace(token, ''));
          onError?.(e instanceof Error ? e.message : 'Upload failed.');
        } finally {
          setUploading((n) => n - 1);
        }
      }
    },
    [onChange, onError, onUpload]
  );

  function run(key: ActionKey) {
    if (ta.current) actions[key](ta.current);
    reportCursor();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    const mod = e.metaKey || e.ctrlKey;

    if (mod && !e.shiftKey && !e.altKey) {
      const map: Record<string, ActionKey> = { b: 'bold', i: 'italic', e: 'code', k: 'link' };
      const key = map[e.key.toLowerCase()];
      if (key) {
        e.preventDefault();
        run(key);
        return;
      }
    }
    if (e.altKey && !mod && (e.key === '2' || e.key === '3')) {
      e.preventDefault();
      run(e.key === '2' ? 'h2' : 'h3');
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const { start, end, lines } = lineRange(el);
      if (el.selectionStart === el.selectionEnd && !e.shiftKey) {
        insertText(el, '  ');
        return;
      }
      const next = lines.map((l) => (e.shiftKey ? l.replace(/^ {1,2}/, '') : `  ${l}`)).join('\n');
      el.setSelectionRange(start, end);
      insertText(el, next);
      el.setSelectionRange(start, start + next.length);
      return;
    }

    // Continue (or end) lists and quotes on Enter.
    if (e.key === 'Enter' && !e.shiftKey && !mod && el.selectionStart === el.selectionEnd) {
      const { value: v, selectionStart: s } = el;
      const lineStart = v.lastIndexOf('\n', s - 1) + 1;
      const line = v.slice(lineStart, s);
      const m = line.match(/^(\s*)([-*+]\s\[[ xX]\]\s|[-*+]\s|(\d+)\.\s|>\s?)/);
      if (!m) return;
      e.preventDefault();
      if (line.trim() === m[0].trim()) {
        // Empty item: drop the marker and leave the list.
        el.setSelectionRange(lineStart, s);
        insertText(el, '');
        return;
      }
      let marker = m[2];
      if (m[3]) marker = `${Number(m[3]) + 1}. `;
      else if (/\[[ xX]\]/.test(marker)) marker = marker.replace(/\[[xX]\]/, '[ ]');
      insertText(el, `\n${m[1]}${marker}`);
    }
  }

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex items-center gap-0.5 overflow-x-auto border-b border-line px-2 py-1.5" role="toolbar" aria-label="Formatting">
        {toolbar.map((item, i) =>
          item === 'sep' ? (
            <span key={`sep-${i}`} className="mx-1 h-4 w-px shrink-0 bg-line" />
          ) : (
            <button
              key={item.key}
              type="button"
              title={item.kbd ? `${item.label} (${item.kbd})` : item.label}
              aria-label={item.label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => run(item.key)}
              className="flex size-8 shrink-0 items-center justify-center rounded-[4px] text-fg-muted transition-colors hover:bg-surface hover:text-fg"
            >
              <item.icon className="size-4" />
            </button>
          )
        )}
        <span className="mx-1 h-4 w-px shrink-0 bg-line" />
        <button
          type="button"
          title="Insert image (or paste / drop one)"
          aria-label="Insert image"
          onClick={() => fileInput.current?.click()}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-[4px] px-2 text-fg-muted transition-colors hover:bg-surface hover:text-fg"
        >
          <ImagePlus className="size-4" />
          <span className="label-mono">{uploading ? `Uploading ${uploading}…` : 'Image'}</span>
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            upload(files);
          }}
        />
      </div>

      <div className="relative min-h-0 flex-1">
        <textarea
          ref={ta}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onKeyUp={reportCursor}
          onClick={reportCursor}
          onSelect={reportCursor}
          onScroll={(e) => {
            const el = e.currentTarget;
            const max = el.scrollHeight - el.clientHeight;
            onScrollRatio?.(max > 0 ? el.scrollTop / max : 0);
          }}
          onPaste={(e) => {
            const files = Array.from(e.clipboardData.files);
            if (files.some((f) => f.type.startsWith('image/'))) {
              e.preventDefault();
              upload(files);
            }
          }}
          onDragOver={(e) => {
            if (Array.from(e.dataTransfer.items).some((i) => i.kind === 'file')) {
              e.preventDefault();
              setDragging(true);
            }
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            const files = Array.from(e.dataTransfer.files);
            setDragging(false);
            if (files.length) {
              e.preventDefault();
              upload(files);
            }
          }}
          spellCheck
          placeholder={'Start writing in Markdown…\n\n## A section heading\n\nParagraphs, **bold**, `code`, lists, tables and images all work.\nPaste or drop an image to upload it.'}
          aria-label="Article body (Markdown)"
          className="absolute inset-0 h-full w-full resize-none bg-transparent px-6 py-6 font-mono text-[13.5px] leading-[1.8] text-fg outline-none placeholder:text-fg-faint sm:px-8"
        />
        {dragging && (
          <div className="pointer-events-none absolute inset-3 grid place-items-center border border-dashed border-signal-ink bg-bg/70">
            <p className="label-mono text-signal-ink">Drop to upload image</p>
          </div>
        )}
      </div>
    </div>
  );
}
