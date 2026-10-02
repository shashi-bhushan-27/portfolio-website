'use client';

import { useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import { BOSS, BOSS_QUESTIONS } from '@/game/data/questions';
import { gameStore } from '@/game/store/game-store';
import { audio } from '@/game/systems/audio';
import { buttonStyles } from '@/components/ui/button';
import { Panel } from '@/game/ui/panel';
import { PixelPortrait } from '@/game/ui/pixel-portrait';
import { Quiz, type QuizResult } from '@/game/ui/quiz';
import { shake } from '@/game/ui/use-appear';
import { useReducedMotion } from '@/game/ui/use-reduced-motion';
import { cn } from '@/lib/utils';

const KILL = Math.ceil(BOSS.hp / BOSS.damage);

export function BossPanel({ onClose }: { onClose: () => void }) {
  const reduced = useReducedMotion();
  const portrait = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [tally, setTally] = useState<QuizResult>({ correct: 0, wrong: 0, answered: 0 });
  const [outcome, setOutcome] = useState<'won' | 'lost' | null>(null);

  const hp = Math.max(0, BOSS.hp - tally.correct * BOSS.damage);
  const lives = BOSS.lives - tally.wrong;

  const restart = () => {
    setTally({ correct: 0, wrong: 0, answered: 0 });
    setOutcome(null);
    setAttempt((a) => a + 1);
  };

  return (
    <Panel
      kicker="Final round"
      title="THE RECRUITER"
      onClose={onClose}
      accent={
        <div ref={portrait} className="mt-0.5 border border-line bg-surface p-1">
          <PixelPortrait who="recruiter" scale={3} />
        </div>
      }
      footer={
        outcome && (
          <>
            {outcome === 'won' ? (
              <button
                type="button"
                data-autofocus
                onClick={() => gameStore.getState().dialogueAction('open-ending')}
                className={buttonStyles({ variant: 'primary', size: 'sm' })}
              >
                Claim the offer
              </button>
            ) : (
              <button type="button" data-autofocus onClick={restart} className={buttonStyles({ variant: 'primary', size: 'sm' })}>
                Ask for another round
              </button>
            )}
            <button type="button" onClick={onClose} className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
              Leave
            </button>
          </>
        )
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <p className="label-mono flex justify-between text-fg-faint">
            <span>Recruiter HP</span>
            <span className="tabular-nums">
              {hp} / {BOSS.hp}
            </span>
          </p>
          <div
            role="meter"
            aria-label="Recruiter HP"
            aria-valuemin={0}
            aria-valuemax={BOSS.hp}
            aria-valuenow={hp}
            className="mt-1.5 h-2.5 border border-line bg-surface-2"
          >
            <div className="h-full bg-danger transition-[width] duration-500" style={{ width: `${hp}%` }} />
          </div>
        </div>
        <p className="flex items-center gap-1" aria-label={`${lives} of ${BOSS.lives} lives left`}>
          {Array.from({ length: BOSS.lives }, (_, i) => (
            <Heart key={i} aria-hidden className={cn('size-4', i < lives ? 'fill-signal text-signal-ink' : 'text-fg-faint')} />
          ))}
        </p>
      </div>

      {outcome === 'won' && (
        <div>
          <p className="font-mono text-2xl tracking-tight text-signal-ink">RECRUITER DEFEATED</p>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            “Alright. You can build things, you can explain them, and you know how they break. We’ll be in touch.”
          </p>
        </div>
      )}
      {outcome === 'lost' && (
        <div>
          <p className="font-mono text-2xl tracking-tight text-danger">“We’ll keep your résumé on file.”</p>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            Three stumbles. Every answer you missed came with an explanation — have another go.
          </p>
        </div>
      )}
      {!outcome && (
        <Quiz
          key={attempt}
          questions={BOSS_QUESTIONS}
          feedback={(_, correct, t) =>
            correct ? BOSS.taunts[(t.correct - 1) % BOSS.taunts.length] : BOSS.ouch[(t.wrong - 1) % BOSS.ouch.length]
          }
          onAnswered={(_, correct, t) => {
            setTally(t);
            audio.play(correct ? 'hit' : 'miss');
            if (correct) shake(portrait.current, reduced);
          }}
          isOver={(t) => t.correct >= KILL || t.wrong >= BOSS.lives}
          onDone={(t) => {
            const won = t.correct >= KILL;
            setOutcome(won ? 'won' : 'lost');
            if (won) {
              audio.play('quest');
              gameStore.getState().defeatBoss();
            }
          }}
        />
      )}
    </Panel>
  );
}
