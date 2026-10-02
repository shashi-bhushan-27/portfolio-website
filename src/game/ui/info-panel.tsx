'use client';

import { INFO } from '@/game/data/info';
import { useGame } from '@/game/store/game-store';
import { EGG_COUNT } from '@/game/systems/progression';
import { Panel } from '@/game/ui/panel';

export function InfoPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const info = INFO[id];
  const eggs = useGame((s) => s.progress.discoveredEasterEggs.length);
  if (!info) return null;
  return (
    <Panel kicker={info.kicker} title={info.title} onClose={onClose} size="sm">
      <div className="space-y-3">
        {info.lines.map((l) => (
          <p key={l} className={info.egg ? 'font-mono text-[14px] leading-relaxed text-fg' : 'text-sm leading-relaxed text-fg-muted'}>
            {l}
          </p>
        ))}
      </div>
      {info.list && (
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {info.list.map((item) => (
            <li key={item.label} className="py-2.5">
              <p className="flex items-center gap-2 text-sm text-fg">
                <span aria-hidden className="font-mono text-signal-ink">→</span>
                {item.label}
              </p>
              {item.detail && <p className="mt-1 pl-5 text-[13px] leading-relaxed text-fg-muted">{item.detail}</p>}
            </li>
          ))}
        </ul>
      )}
      {info.egg && <p className="label-mono mt-5 text-signal-ink">Easter eggs found: {eggs} / {EGG_COUNT}</p>}
    </Panel>
  );
}
