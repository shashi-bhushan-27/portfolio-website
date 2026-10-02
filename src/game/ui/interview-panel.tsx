'use client';

import { useState } from 'react';
import { INTERVIEW_QUESTIONS } from '@/game/data/questions';
import { gameStore, useGame } from '@/game/store/game-store';
import { audio } from '@/game/systems/audio';
import { buttonStyles } from '@/components/ui/button';
import { Panel } from '@/game/ui/panel';
import { PixelPortrait } from '@/game/ui/pixel-portrait';
import { Quiz, type QuizResult } from '@/game/ui/quiz';

export function InterviewPanel({ onClose }: { onClose: () => void }) {
  const [result, setResult] = useState<QuizResult | null>(null);
  const bossDefeated = useGame((s) => s.progress.bossDefeated);
  const total = INTERVIEW_QUESTIONS.length;

  return (
    <Panel
      kicker="Interview Room"
      title={result ? 'Interview complete' : 'A few questions. Real ones.'}
      onClose={onClose}
      accent={<PixelPortrait who="recruiter" scale={3} className="mt-0.5 hidden sm:block" />}
      footer={
        result && (
          <>
            {!bossDefeated && (
              <button
                type="button"
                data-autofocus
                onClick={() => gameStore.getState().dialogueAction('start-boss')}
                className={buttonStyles({ variant: 'primary', size: 'sm' })}
              >
                Final round
              </button>
            )}
            <button type="button" onClick={onClose} className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
              {bossDefeated ? 'Close' : 'Not yet'}
            </button>
          </>
        )
      }
    >
      {result ? (
        <div>
          <p className="font-mono text-4xl tracking-tight text-fg tabular-nums">
            {result.correct}
            <span className="text-fg-faint"> / {total}</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            {result.correct === total
              ? '“That’s exactly how I’d want someone to think about it.”'
              : result.correct >= total / 2
                ? '“Solid. A couple of those we’d dig into on the job.”'
                : '“Hm. Let’s say there’s room to grow.”'}
          </p>
          {!bossDefeated && (
            <p className="mt-3 text-sm leading-relaxed text-fg">
              The recruiter leans back. “One more round — and this one decides it.”
            </p>
          )}
        </div>
      ) : (
        <Quiz
          questions={INTERVIEW_QUESTIONS}
          feedback={(_, correct) => (correct ? 'Good. That’s what I’d want to hear.' : 'Hm. Let’s talk about that.')}
          onAnswered={(_, correct) => audio.play(correct ? 'hit' : 'miss')}
          onDone={(r) => {
            setResult(r);
            gameStore.getState().finishInterview(r.correct);
          }}
        />
      )}
    </Panel>
  );
}
