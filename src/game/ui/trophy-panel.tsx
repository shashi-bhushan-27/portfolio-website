'use client';

import { TROPHIES } from '@/game/data/trophies';
import { OutLink } from '@/game/ui/links';
import { Panel } from '@/game/ui/panel';

export function TrophyPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const t = TROPHIES[id];
  if (!t) return null;
  return (
    <Panel
      kicker={`Trophy Room · ${t.kind}`}
      title={t.title}
      onClose={onClose}
      size="sm"
      footer={t.link && <OutLink href={t.link.href}>{t.link.label}</OutLink>}
    >
      {t.facts.length > 0 && (
        <dl className="grid gap-px bg-line">
          {t.facts.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 bg-bg py-2">
              <dt className="label-mono text-fg-faint">{k}</dt>
              <dd className="text-right font-mono text-[13px] text-fg">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-4 text-sm leading-relaxed text-fg-muted">{t.body}</p>
      {t.items && (
        <ul className="mt-4 space-y-2">
          {t.items.map((i) => (
            <li key={i} className="flex gap-3 text-sm text-fg">
              <span aria-hidden className="mt-[0.55em] size-1.5 shrink-0 bg-signal" />
              {i}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
