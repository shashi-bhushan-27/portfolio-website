'use client';

import { useEffect, useRef, useState } from 'react';
import { CopyButton } from '@/components/ui/copy-button';

/** Framed code block with a language label and a copy button. */
export function CodeBlock({
  language,
  children,
}: {
  language?: string;
  children: React.ReactNode;
}) {
  const preRef = useRef<HTMLPreElement>(null);
  const [text, setText] = useState('');

  // The highlighted markup is nested spans; read the plain text once it's in the DOM.
  useEffect(() => {
    setText(preRef.current?.textContent ?? '');
  }, [children]);

  return (
    <div className="code-frame overflow-hidden rounded-[4px] border border-line">
      <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-3 py-1.5">
        <span className="label-mono text-fg-faint">{language ?? 'text'}</span>
        <CopyButton value={text} className="label-mono" />
      </div>
      <pre ref={preRef} className="!mt-0 !rounded-none">
        {children}
      </pre>
    </div>
  );
}
