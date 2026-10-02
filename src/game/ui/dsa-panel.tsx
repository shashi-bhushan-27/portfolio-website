'use client';

import { useState } from 'react';
import { DSA_QUESTIONS, DSA_WRONG_LINES } from '@/game/data/questions';
import { gameStore } from '@/game/store/game-store';
import { buttonStyles } from '@/components/ui/button';
import { Panel } from '@/game/ui/panel';
import { PixelPortrait } from '@/game/ui/pixel-portrait';
import { Quiz, type QuizResult } from '@/game/ui/quiz';

const PASS = 3;

export function DsaPanel({ onClose }: { onClose: () => void }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const store = gameStore.getState();

  return (
    <Panel
      kicker="DSA Arena · 5 problems"
      title={result ? (result.correct >= PASS ? 'Accepted.' : 'Time Limit Exceeded.') : 'Let’s see if you actually know DSA.'}
      onClose={onClose}
      accent={<PixelPortrait who="keeper" scale={3} className="mt-0.5 hidden sm:block" />}
      footer={
        result && (
          <>
            <button
              type="button"
              data-autofocus
              onClick={() => {
                setResult(null);
                setAttempt((a) => a + 1);
              }}
              className={buttonStyles({ variant: result.correct >= PASS ? 'secondary' : 'primary', size: 'sm' })}
            >
              {result.correct >= PASS ? 'Run it again' : 'Try again'}
            </button>
            <button type="button" onClick={onClose} className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
              Leave the arena
            </button>
          </>
        )
      }
    >
      {result ? (
        <div>
          <p className="font-mono text-4xl tracking-tight text-fg tabular-nums">
            {result.correct}
            <span className="text-fg-faint"> / {DSA_QUESTIONS.length}</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            {result.correct === DSA_QUESTIONS.length
              ? 'All test cases passed. The Arena Keeper nods, almost imperceptibly.'
              : result.correct >= PASS
                ? `${result.correct} of ${DSA_QUESTIONS.length} test cases passed. Good enough to ship; good enough to keep practising.`
                : `${result.correct} of ${DSA_QUESTIONS.length} passed. You need ${PASS} to clear the arena.`}
          </p>
        </div>
      ) : (
        <Quiz
          key={attempt}
          questions={DSA_QUESTIONS}
          showComplexity
          feedback={(q, correct, tally) =>
            correct ? 'Accepted.' : DSA_WRONG_LINES[(tally.wrong - 1) % DSA_WRONG_LINES.length]
          }
          onAnswered={(q, correct) => store.answerDsa(q.id, correct)}
          onDone={(r) => {
            setResult(r);
            store.finishDsa(r.correct);
          }}
        />
      )}
    </Panel>
  );
}
