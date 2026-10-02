'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import type { Question } from '@/game/data/questions';
import { buttonStyles } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type QuizResult = { correct: number; wrong: number; answered: number };

type QuizProps = {
  questions: Question[];
  /** Line shown after an answer, e.g. "Accepted." */
  feedback: (q: Question, correct: boolean, tally: QuizResult) => string;
  onAnswered?: (q: Question, correct: boolean, tally: QuizResult) => void;
  /** End early (the boss runs out of HP, or you run out of lives). */
  isOver?: (tally: QuizResult) => boolean;
  onDone: (tally: QuizResult) => void;
  showComplexity?: boolean;
};

const LETTERS = ['A', 'B', 'C', 'D'];

export function Quiz({ questions, feedback, onAnswered, isOver, onDone, showComplexity }: QuizProps) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [tally, setTally] = useState<QuizResult>({ correct: 0, wrong: 0, answered: 0 });
  const [line, setLine] = useState('');
  const nextRef = useRef<HTMLButtonElement>(null);
  const firstRef = useRef<HTMLButtonElement>(null);
  const q = questions[index];
  const answered = picked !== null;
  const over = answered && (index === questions.length - 1 || !!isOver?.(tally));

  const pick = (i: number) => {
    if (answered) return;
    const correct = i === q.answer;
    const next = {
      correct: tally.correct + (correct ? 1 : 0),
      wrong: tally.wrong + (correct ? 0 : 1),
      answered: tally.answered + 1,
    };
    setPicked(i);
    setTally(next);
    setLine(feedback(q, correct, next));
    onAnswered?.(q, correct, next);
  };

  const next = () => {
    if (over) {
      onDone(tally);
      return;
    }
    setIndex((n) => n + 1);
    setPicked(null);
    setLine('');
  };

  useEffect(() => {
    if (answered) nextRef.current?.focus();
    else firstRef.current?.focus();
  }, [answered, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || answered) return;
      const k = e.key.toUpperCase();
      const i = /^[1-4]$/.test(k) ? Number(k) - 1 : LETTERS.indexOf(k);
      if (i >= 0 && i < q.options.length) {
        e.preventDefault();
        pick(i);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const correctPick = picked === q.answer;

  return (
    <div>
      <p className="label-mono flex justify-between text-fg-faint">
        <span>{q.topic}</span>
        <span>
          {index + 1} / {questions.length}
        </span>
      </p>
      <p className="mt-3 text-[16px] leading-snug font-medium tracking-[-0.01em] text-fg text-pretty sm:text-lg">{q.prompt}</p>

      <ul className="mt-5 space-y-2">
        {q.options.map((opt, i) => {
          const isAnswer = i === q.answer;
          const isPicked = i === picked;
          return (
            <li key={opt}>
              <button
                ref={i === 0 ? firstRef : undefined}
                type="button"
                disabled={answered}
                onClick={() => pick(i)}
                className={cn(
                  'flex w-full items-start gap-3 border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-default',
                  !answered && 'border-line text-fg hover:border-signal-ink hover:bg-surface',
                  answered && isAnswer && 'border-signal-ink bg-signal/10 text-fg',
                  answered && isPicked && !isAnswer && 'border-danger/60 bg-danger/10 text-fg',
                  answered && !isAnswer && !isPicked && 'border-line text-fg-faint'
                )}
              >
                <span className="mt-px font-mono text-[11px] text-fg-faint">{LETTERS[i]}</span>
                <span className="flex-1">{opt}</span>
                {answered && isAnswer && <Check aria-label="Correct answer" className="size-4 shrink-0 text-signal-ink" />}
                {answered && isPicked && !isAnswer && <X aria-label="Your answer" className="size-4 shrink-0 text-danger" />}
              </button>
            </li>
          );
        })}
      </ul>

      <div aria-live="polite" className="mt-4 min-h-6">
        {answered && (
          <div className="border-l-2 pl-4" style={{ borderColor: correctPick ? 'var(--signal-ink)' : 'var(--danger)' }}>
            <p className={cn('font-mono text-[14px]', correctPick ? 'text-signal-ink' : 'text-danger')}>{line}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{q.explain}</p>
            {showComplexity && q.complexity && <p className="mt-1.5 font-mono text-[12.5px] text-fg">{q.complexity}</p>}
          </div>
        )}
      </div>

      {answered && (
        <div className="mt-5 flex justify-end">
          <button ref={nextRef} type="button" onClick={next} className={buttonStyles({ variant: 'primary', size: 'md' })}>
            {over ? 'See result' : 'Next question'}
          </button>
        </div>
      )}
      {!answered && <p className="label-mono mt-5 text-fg-faint">Press 1–4 or A–D</p>}
    </div>
  );
}
