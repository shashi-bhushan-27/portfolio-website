'use client';

import { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { findPath, type Point } from '@/game/systems/pathfinding';
import { useReducedMotion } from '@/game/ui/use-reduced-motion';
import { cn } from '@/lib/utils';

// 20 × 12 floor plan, one cell ≈ 1 m. '#' is wall.
const PLAN = [
  '####################',
  '#......#...#.......#',
  '#......#...#.......#',
  '#......#...........#',
  '#..........#.......#',
  '###.#####.###.###.##',
  '#......#...........#',
  '#......#...#.......#',
  '#..........#.......#',
  '#......#...#.......#',
  '#......#...#.......#',
  '####################',
];
const COLS = PLAN[0].length;
const ROWS = PLAN.length;
const C = 16;

const DESTINATIONS = [
  { id: 'lab', label: 'Lab', x: 3, y: 2 },
  { id: 'library', label: 'Library', x: 15, y: 2 },
  { id: 'cafeteria', label: 'Cafeteria', x: 3, y: 9 },
  { id: 'exit', label: 'Exit', x: 17, y: 9 },
] as const;
type DestId = (typeof DESTINATIONS)[number]['id'];

const ACCESS_POINTS: Point[] = [
  { x: 1, y: 1 },
  { x: 18, y: 1 },
  { x: 1, y: 10 },
  { x: 18, y: 10 },
];

// Where the device really is, and the error of each illustrative prediction (metres).
const SCANS = [
  { device: { x: 9.5, y: 3.5 }, error: { x: 0.8, y: -1.1 } },
  { device: { x: 14.5, y: 7.5 }, error: { x: -1.2, y: 0.6 } },
  { device: { x: 4.5, y: 3.5 }, error: { x: 1, y: 1.1 } },
  { device: { x: 9.5, y: 8.5 }, error: { x: -0.6, y: -1.3 } },
];

const wall = (x: number, y: number) => PLAN[y]?.[x] !== '.';

export function IndoorNavDemo({ steps }: { steps: string[] }) {
  const reduced = useReducedMotion();
  const [scan, setScan] = useState(0);
  const [dest, setDest] = useState<DestId>('library');
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage >= steps.length) return;
    const t = setTimeout(() => setStage((s) => s + 1), reduced ? 0 : 380);
    return () => clearTimeout(t);
  }, [stage, steps.length, reduced]);

  const { device, error } = SCANS[scan];
  const predicted = { x: device.x + error.x, y: device.y + error.y };
  const errorM = Math.hypot(error.x, error.y);

  const start = useMemo(() => {
    const p = { x: Math.floor(predicted.x), y: Math.floor(predicted.y) };
    return wall(p.x, p.y) ? { x: Math.floor(device.x), y: Math.floor(device.y) } : p;
  }, [predicted.x, predicted.y, device.x, device.y]);
  const goal = DESTINATIONS.find((d) => d.id === dest)!;
  const path = useMemo(() => findPath(wall, COLS, ROWS, start, goal), [start, goal]);

  const run = (nextScan: number, nextDest: DestId) => {
    setScan(nextScan);
    setDest(nextDest);
    setStage(reduced ? steps.length : 0);
  };

  const done = stage >= steps.length;
  const showPosition = stage >= steps.length - 1;
  const active = done ? -1 : stage;

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_14rem]">
      <figure>
        <svg
          viewBox={`0 0 ${COLS * C} ${ROWS * C}`}
          role="img"
          aria-label={`Floor plan. The device is located with about ${errorM.toFixed(1)} m error and routed to the ${goal.label.toLowerCase()}.`}
          className="w-full border border-line bg-[var(--surface)]"
        >
          {PLAN.flatMap((row, y) =>
            [...row].map((ch, x) =>
              ch === '#' ? <rect key={`${x},${y}`} x={x * C} y={y * C} width={C} height={C} fill="var(--surface-2)" /> : null
            )
          )}
          {DESTINATIONS.map((d) => (
            <text
              key={d.id}
              x={d.x * C + C / 2}
              y={d.y * C + C / 2 + 3}
              textAnchor="middle"
              className="font-mono"
              fontSize="8"
              fill={d.id === dest ? 'var(--signal-ink)' : 'var(--fg-faint)'}
            >
              {d.label}
            </text>
          ))}
          {ACCESS_POINTS.map((ap, i) => (
            <g key={i}>
              <circle cx={ap.x * C + C / 2} cy={ap.y * C + C / 2} r={3} fill="var(--fg-muted)" />
              {!done && stage <= 1 && (
                <circle cx={ap.x * C + C / 2} cy={ap.y * C + C / 2} r={14} fill="none" stroke="var(--fg-faint)" strokeWidth={1}>
                  {!reduced && <animate attributeName="r" values="4;60" dur="1.1s" repeatCount="indefinite" />}
                  {!reduced && <animate attributeName="opacity" values="0.8;0" dur="1.1s" repeatCount="indefinite" />}
                </circle>
              )}
            </g>
          ))}
          <circle cx={device.x * C} cy={device.y * C} r={3} fill="var(--fg)" />
          {showPosition && (
            <g>
              <circle cx={predicted.x * C} cy={predicted.y * C} r={1.6 * C} fill="var(--signal)" fillOpacity={0.12} stroke="var(--signal-ink)" strokeDasharray="3 3" />
              <circle cx={predicted.x * C} cy={predicted.y * C} r={3.5} fill="var(--signal)" />
            </g>
          )}
          {done && path && (
            <polyline
              points={path.map((p) => `${p.x * C + C / 2},${p.y * C + C / 2}`).join(' ')}
              fill="none"
              stroke="var(--signal-ink)"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          )}
        </svg>
        <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-fg-faint">
          <span>● true position</span>
          <span className="text-signal-ink">● prediction · 1.6 m circle</span>
          <span>illustration of the pipeline — measured results below</span>
        </figcaption>
      </figure>

      <div>
        <ol className="space-y-1">
          {steps.map((s, i) => (
            <li
              key={s}
              className={cn(
                'border-l-2 py-0.5 pl-2.5 font-mono text-[12px] transition-colors',
                i === active ? 'border-signal-ink text-fg' : i < stage ? 'border-line text-fg-muted' : 'border-line text-fg-faint'
              )}
            >
              {s}
            </li>
          ))}
        </ol>

        <p className="label-mono mt-4 text-fg-faint">Route to</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {DESTINATIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={d.id === dest}
              onClick={() => run(scan, d.id)}
              className={cn(
                'border px-2 py-1 text-[13px] transition-colors',
                d.id === dest ? 'border-signal-ink bg-signal/10 text-fg' : 'border-line text-fg-muted hover:border-border hover:text-fg'
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => run((scan + 1) % SCANS.length, dest)}
          className="mt-2 flex w-full items-center justify-center gap-2 border border-line px-2 py-1 text-[13px] text-fg-muted transition-colors hover:border-border hover:text-fg"
        >
          <RotateCcw className="size-3.5" />
          Move device &amp; re-scan
        </button>

        <p className="mt-4 font-mono text-[12px] leading-relaxed text-fg-muted" aria-live="polite">
          {done
            ? `Error ${errorM.toFixed(1)} m · route ${path ? path.length - 1 : '—'} m`
            : `${steps[stage] ?? ''}…`}
        </p>
      </div>
    </div>
  );
}
