'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TagInput({
  id,
  value,
  onChange,
  suggestions = [],
  max = 12,
}: {
  id: string;
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  max?: number;
}) {
  const [draft, setDraft] = useState('');

  function add(raw: string) {
    const parts = raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const next = [...value];
    for (const p of parts) {
      if (next.length >= max) break;
      if (!next.some((t) => t.toLowerCase() === p.toLowerCase())) next.push(p);
    }
    onChange(next);
    setDraft('');
  }

  const unused = suggestions.filter(
    (s) => !value.some((t) => t.toLowerCase() === s.toLowerCase()) && s.toLowerCase().includes(draft.toLowerCase())
  );

  return (
    <div>
      <div
        className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-[4px] border border-line bg-surface/40 px-2 py-1.5 focus-within:border-fg-faint"
        onClick={() => document.getElementById(id)?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-[3px] bg-surface-2 py-0.5 pr-1 pl-2 font-mono text-[11.5px] text-fg"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="rounded-[2px] p-0.5 text-fg-faint hover:text-fg"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => {
            if (e.target.value.includes(',')) add(e.target.value);
            else setDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim()) {
              e.preventDefault();
              add(draft);
            } else if (e.key === 'Backspace' && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={value.length ? '' : 'Add tags…'}
          disabled={value.length >= max}
          className="min-w-[6rem] flex-1 bg-transparent px-1 py-0.5 text-sm text-fg outline-none placeholder:text-fg-faint"
        />
      </div>
      {unused.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {unused.slice(0, 10).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className={cn(
                'rounded-[3px] border border-dashed border-line px-1.5 py-0.5 font-mono text-[11px] text-fg-faint hover:border-border hover:text-fg'
              )}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
