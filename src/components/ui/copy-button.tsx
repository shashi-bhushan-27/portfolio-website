'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  className,
  showLabel = true,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  showLabel?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked (insecure context, permissions); nothing useful to do.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? copiedLabel : label}
      className={cn(
        'inline-flex items-center gap-1.5 text-fg-muted transition-colors hover:text-fg',
        className
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-signal-ink" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {showLabel && (
        <span aria-live="polite">{copied ? copiedLabel : label}</span>
      )}
    </button>
  );
}
