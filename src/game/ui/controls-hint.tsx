'use client';

import { useEffect, useState } from 'react';

const SHOW_FOR_MS = 9000;

export const CONTROLS = [
  ['Move', 'W A S D / arrow keys — or tap where to go'],
  ['Interact', 'E or Space — or tap the thing'],
  ['Quests', 'Q'],
  ['Pause', 'Esc'],
  ['Sound', 'M'],
] as const;

/** Shown on entering the world, then gets out of the way. */
export function ControlsHint() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setOpen(false), SHOW_FOR_MS);
    return () => clearTimeout(t);
  }, []);

  if (!open) return null;

  return (
    <div
      role="status"
      className="absolute bottom-20 left-1/2 z-10 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 border border-line bg-bg/90 p-4 backdrop-blur-sm sm:bottom-6"
    >
      <div className="flex items-baseline justify-between">
        <p className="label-mono text-fg-faint">Controls</p>
        <button type="button" onClick={() => setOpen(false)} className="label-mono text-fg-muted link-underline hover:text-fg">
          Got it
        </button>
      </div>
      <dl className="mt-3 grid grid-cols-[4.5rem_minmax(0,1fr)] gap-y-1.5 font-mono text-[12.5px]">
        {CONTROLS.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-fg-faint">{k}</dt>
            <dd className="text-fg">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
