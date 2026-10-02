'use client';

import { useMemo, useState } from 'react';
import {
  CHOICE_GROUPS,
  formatInr,
  MONTHS,
  simulate,
  STARTING_CASH,
  type MonthResult,
  type Outcome,
  type StartupChoices,
} from '@/game/data/startup';
import { gameStore } from '@/game/store/game-store';
import { buttonStyles } from '@/components/ui/button';
import { Panel, PanelSection } from '@/game/ui/panel';
import { PixelPortrait } from '@/game/ui/pixel-portrait';
import { cn } from '@/lib/utils';

const DEFAULTS: StartupChoices = { product: 'devtool', pricing: 'freemium', marketing: 'community', team: 'solo' };

export function StartupPanel({ onClose }: { onClose: () => void }) {
  const [choices, setChoices] = useState<StartupChoices>(DEFAULTS);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const run = () => {
    setOutcome(simulate(choices));
    gameStore.getState().finishStartup();
  };

  return (
    <Panel
      kicker="Startup Garage · ₹10,00,000 · 12 months"
      title={outcome ? outcome.verdict : 'Build something in a year'}
      onClose={onClose}
      size="lg"
      accent={<PixelPortrait who="founder" scale={3} className="mt-0.5 hidden sm:block" />}
      footer={
        outcome ? (
          <>
            <button type="button" data-autofocus onClick={() => setOutcome(null)} className={buttonStyles({ variant: 'primary', size: 'sm' })}>
              Try another strategy
            </button>
            <button type="button" onClick={onClose} className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
              Close
            </button>
            <span className="label-mono ml-auto text-fg-faint">Toy model · numbers are illustrative</span>
          </>
        ) : (
          <>
            <button type="button" onClick={run} className={buttonStyles({ variant: 'primary', size: 'sm' })}>
              Simulate 12 months
            </button>
            <span className="label-mono ml-auto text-fg-faint">Budget {formatInr(STARTING_CASH)} · runway 12 months</span>
          </>
        )
      }
    >
      {outcome ? (
        <Result outcome={outcome} />
      ) : (
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {CHOICE_GROUPS.map((g) => (
            <fieldset key={g.key}>
              <legend className="label-mono text-fg-faint">{g.title}</legend>
              <div className="mt-2 space-y-1.5">
                {g.options.map((o, i) => {
                  const selected = choices[g.key] === o.id;
                  return (
                    <label
                      key={o.id}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 border px-3 py-2 transition-colors',
                        selected ? 'border-signal-ink bg-signal/10' : 'border-line hover:border-border'
                      )}
                    >
                      <input
                        type="radio"
                        name={g.key}
                        value={o.id}
                        checked={selected}
                        data-autofocus={g.key === 'product' && i === 0 ? '' : undefined}
                        onChange={() => setChoices((c) => ({ ...c, [g.key]: o.id }))}
                        className="mt-1 accent-[var(--signal-ink)]"
                      />
                      <span>
                        <span className="block text-sm text-fg">{o.label}</span>
                        <span className="block text-[12.5px] text-fg-muted">{o.hint}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      )}
    </Panel>
  );
}

function Result({ outcome }: { outcome: Outcome }) {
  const last = outcome.months[outcome.months.length - 1];
  const tiles = [
    { label: 'Users', value: last.users.toLocaleString('en-IN') },
    { label: 'Monthly revenue', value: formatInr(last.revenue) },
    { label: 'Monthly burn', value: formatInr(last.burn) },
    { label: outcome.alive ? 'Cash left' : 'Cash', value: formatInr(last.cash) },
  ];
  return (
    <div>
      <p className="max-w-[62ch] text-[15px] leading-relaxed text-fg text-pretty">{outcome.lesson}</p>
      <dl className="mt-5 grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-bg px-3 py-2.5">
            <dt className="label-mono text-fg-faint">{t.label}</dt>
            <dd className="mt-1 text-lg font-medium tracking-tight text-fg">{t.value}</dd>
          </div>
        ))}
      </dl>
      <PanelSection label={`Cash at the end of each month${outcome.alive ? '' : ` · out of cash in month ${last.month}`}`}>
        <CashChart months={outcome.months} />
      </PanelSection>
    </div>
  );
}

/** One series, one axis: cash by month. Hover or focus a month for its numbers. */
function CashChart({ months }: { months: MonthResult[] }) {
  const [active, setActive] = useState<number | null>(null);
  const { max, min } = useMemo(() => {
    const values = months.map((m) => m.cash);
    return { max: Math.max(STARTING_CASH, ...values), min: Math.min(0, ...values) };
  }, [months]);
  const range = max - min || 1;
  const PLOT = 132;
  const zeroFromTop = (max / range) * PLOT;
  const shown = active === null ? months[months.length - 1] : months[active];

  return (
    <div>
      <p className="font-mono text-[12px] text-fg-muted" aria-live="polite">
        Month {shown.month}: cash {formatInr(shown.cash)} · {shown.users.toLocaleString('en-IN')} users · revenue{' '}
        {formatInr(shown.revenue)} · burn {formatInr(shown.burn)}
      </p>
      <div className="relative mt-3" style={{ height: PLOT }}>
        <span aria-hidden className="absolute inset-x-0 border-t border-line" style={{ top: zeroFromTop }} />
        <ol className="absolute inset-0 flex">
          {Array.from({ length: MONTHS }, (_, i) => {
            const m = months[i];
            if (!m) return <li key={i} className="flex-1" aria-hidden />;
            const h = (Math.abs(m.cash) / range) * PLOT;
            const negative = m.cash < 0;
            return (
              <li key={i} className="flex flex-1 justify-center px-px">
                <button
                  type="button"
                  aria-label={`Month ${m.month}: cash ${formatInr(m.cash)}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="relative h-full w-full max-w-6 outline-offset-1"
                >
                  <span
                    className={cn(
                      'absolute inset-x-[2px]',
                      negative ? 'rounded-b-[4px] bg-danger' : 'rounded-t-[4px] bg-signal',
                      active !== null && active !== i && 'opacity-50'
                    )}
                    style={negative ? { top: zeroFromTop, height: Math.max(2, h) } : { top: zeroFromTop - h, height: Math.max(2, h) }}
                  />
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <ol aria-hidden className="mt-1.5 flex font-mono text-[10px] text-fg-faint">
        {Array.from({ length: MONTHS }, (_, i) => (
          <li key={i} className="flex-1 text-center tabular-nums">
            {i + 1}
          </li>
        ))}
      </ol>
      <details className="mt-3">
        <summary className="label-mono cursor-pointer text-fg-muted hover:text-fg">Show as a table</summary>
        <table className="mt-2 w-full font-mono text-[12px]">
          <thead>
            <tr className="text-left text-fg-faint">
              <th className="py-1 font-normal">Month</th>
              <th className="py-1 font-normal">Users</th>
              <th className="py-1 font-normal">Revenue</th>
              <th className="py-1 font-normal">Burn</th>
              <th className="py-1 text-right font-normal">Cash</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.month} className="border-t border-line text-fg-muted tabular-nums">
                <td className="py-1">{m.month}</td>
                <td className="py-1">{m.users.toLocaleString('en-IN')}</td>
                <td className="py-1">{formatInr(m.revenue)}</td>
                <td className="py-1">{formatInr(m.burn)}</td>
                <td className="py-1 text-right text-fg">{formatInr(m.cash)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
