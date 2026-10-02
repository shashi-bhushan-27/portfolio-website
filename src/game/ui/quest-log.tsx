'use client';

import { Check, Lock } from 'lucide-react';
import { ACHIEVEMENTS } from '@/game/data/achievements';
import { QUESTS } from '@/game/data/quests';
import { AREAS } from '@/game/data/world';
import { useGame } from '@/game/store/game-store';
import { EGG_COUNT, levelFor } from '@/game/systems/progression';
import { Panel } from '@/game/ui/panel';
import { cn } from '@/lib/utils';

export function XpBar({ xp, className }: { xp: number; className?: string }) {
  const { level, floor, next, max } = levelFor(xp);
  const pct = max ? 100 : ((xp - floor) / (next! - floor)) * 100;
  return (
    <div className={className}>
      <p className="label-mono flex justify-between gap-3 text-fg-faint">
        <span className="text-fg">Level {level}</span>
        <span className="tabular-nums">{max ? `${xp} XP · max` : `${xp} / ${next} XP`}</span>
      </p>
      <div
        role="progressbar"
        aria-label="Experience"
        aria-valuemin={floor}
        aria-valuemax={next ?? xp}
        aria-valuenow={xp}
        className="mt-1.5 h-1.5 bg-surface-2"
      >
        <div className="h-full bg-signal transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function QuestLog({ onClose }: { onClose: () => void }) {
  const progress = useGame((s) => s.progress);
  return (
    <Panel kicker="Quest log" title="What the Recruiter wants to see" onClose={onClose}>
      <XpBar xp={progress.xp} />
      <ol className="mt-6 divide-y divide-line border-y border-line">
        {QUESTS.map((q) => {
          const done = progress.completedQuests.includes(q.id);
          const locked = !done && q.required?.some((r) => !progress.completedQuests.includes(r));
          const [have, need] = q.progress(progress);
          const where = AREAS.find((a) => a.id === q.where)?.name;
          return (
            <li key={q.id} className="flex gap-3 py-3.5">
              <span
                aria-hidden
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center border',
                  done ? 'border-signal-ink bg-signal text-on-signal' : 'border-border text-fg-faint'
                )}
              >
                {done ? <Check className="size-3.5" /> : locked ? <Lock className="size-3" /> : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-medium', done ? 'text-fg-muted line-through decoration-fg-faint' : 'text-fg')}>
                  {q.title}
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-fg-muted">
                  {locked ? 'Unlocks after the interview.' : q.description}
                </p>
                <p className="label-mono mt-1.5 text-fg-faint">
                  {done ? 'Complete' : `${have} / ${need}`} · {where} · +{q.rewardXP} XP
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

export function AchievementsPanel({ onClose }: { onClose: () => void }) {
  const progress = useGame((s) => s.progress);
  return (
    <Panel kicker="Achievements" title={`${progress.achievements.length} of ${ACHIEVEMENTS.length} unlocked`} onClose={onClose}>
      <ul className="grid gap-px bg-line sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const got = progress.achievements.includes(a.id);
          return (
            <li key={a.id} className="flex gap-3 bg-bg p-3.5">
              <span
                aria-hidden
                className={cn('mt-0.5 size-2 shrink-0', got ? 'bg-signal' : 'border border-border')}
              />
              <div>
                <p className={cn('font-mono text-[12.5px] tracking-wide uppercase', got ? 'text-fg' : 'text-fg-faint')}>{a.title}</p>
                <p className="mt-0.5 text-[13px] text-fg-muted">{a.description}</p>
                <p className="sr-only">{got ? 'Unlocked' : 'Locked'}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="label-mono mt-5 text-fg-faint">
        Easter eggs found: {progress.discoveredEasterEggs.length} / {EGG_COUNT} — some are typed, some are tapped, one is knocked.
      </p>
    </Panel>
  );
}
