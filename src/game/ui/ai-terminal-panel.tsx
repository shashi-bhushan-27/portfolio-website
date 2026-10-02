'use client';

import { AI_TERMINALS, type AiTerminalId } from '@/game/data/ai-lab';
import { projectById } from '@/game/data/projects';
import { gameStore, useGame } from '@/game/store/game-store';
import { Panel, PanelSection } from '@/game/ui/panel';
import { Pipeline } from '@/game/ui/pipeline';

export function AiTerminalPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const t = AI_TERMINALS[id as AiTerminalId];
  const inspected = useGame((s) => s.progress.inspectedTerminals.length);
  if (!t) return null;

  return (
    <Panel kicker={`AI Lab · ${t.kicker}`} title={t.title} onClose={onClose} size="lg">
      <p className="max-w-[62ch] text-[15px] leading-relaxed text-fg text-pretty">{t.concept}</p>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        <PanelSection label={t.pipelineTitle}>
          <Pipeline steps={t.pipeline} label={t.pipelineTitle} />
        </PanelSection>

        <PanelSection label="Where I’ve built it">
          <ul className="divide-y divide-line border-y border-line">
            {t.usedIn.map((u) => {
              const p = projectById(u.project);
              if (!p) return null;
              return (
                <li key={u.project} className="py-3">
                  <button
                    type="button"
                    onClick={() => gameStore.getState().openPanel({ kind: 'project', id: p.id })}
                    className="text-left text-sm font-medium text-fg link-underline hover:text-signal-ink"
                  >
                    {p.name}
                  </button>
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">{u.how}</p>
                </li>
              );
            })}
          </ul>
        </PanelSection>
      </div>

      <PanelSection label="Lesson learned">
        <blockquote className="border-l-2 border-signal-ink pl-4 text-[15px] leading-relaxed text-fg">{t.takeaway}</blockquote>
      </PanelSection>

      <p className="label-mono mt-6 text-fg-faint">Terminals inspected: {Math.min(inspected, 4)} / 4</p>
    </Panel>
  );
}
