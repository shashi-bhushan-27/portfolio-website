'use client';

import { useMemo, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks';
import type { SystemArchitectureData, SystemArchitectureNode } from '@/lib/types';
import { cn } from '@/lib/utils';

/* Diagram coordinates are authored in a 620×300 space (see SystemArchitecture.nodes). */
const W = 620;
const H = 300;
const NODE_W = 130;
const NODE_H = 56;

function center(n: SystemArchitectureNode) {
  return { x: n.x + NODE_W / 2, y: n.y + NODE_H / 2 };
}

/** Clip the centre-to-centre segment to the edges of both node boxes. */
function edgeSegment(a: SystemArchitectureNode, b: SystemArchitectureNode, gap = 6) {
  const c1 = center(a);
  const c2 = center(b);
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const exit = (hw: number, hh: number) =>
    Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
  const t = exit(NODE_W / 2 + gap, NODE_H / 2 + gap);
  return {
    x1: c1.x + dx * t,
    y1: c1.y + dy * t,
    x2: c2.x - dx * t,
    y2: c2.y - dy * t,
  };
}

function Board({
  arch,
  mode,
  hovered,
  onHover,
}: {
  arch: SystemArchitectureData;
  mode: '2d' | '3d';
  hovered: string | null;
  onHover: (id: string | null) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const byId = useMemo(() => new Map(arch.nodes.map((n) => [n.id, n])), [arch.nodes]);

  const linked = useMemo(() => {
    if (!hovered) return null;
    const nodes = new Set([hovered]);
    const edges = new Set<number>();
    arch.edges.forEach((e, i) => {
      if (e.from === hovered || e.to === hovered) {
        edges.add(i);
        nodes.add(e.from);
        nodes.add(e.to);
      }
    });
    return { nodes, edges };
  }, [hovered, arch.edges]);

  const is3d = mode === '3d';

  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <div
        className={cn(
          'relative min-w-[640px] [perspective:1600px] transition-[padding] duration-700',
          is3d ? 'pt-6 pb-16' : 'py-10'
        )}
        style={{ perspectiveOrigin: '50% 30%' }}
      >
        <div
          className={cn(
            'relative mx-auto aspect-[620/300] w-full max-w-[860px] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [transform-style:preserve-3d]',
            is3d && '[transform:rotateX(52deg)_rotateZ(-26deg)_scale(0.82)]'
          )}
        >
          {/* the board */}
          <div
            className={cn(
              'absolute -inset-6 border border-line bg-blueprint transition-colors duration-700',
              is3d ? 'bg-surface/60' : 'bg-transparent'
            )}
          />

          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            aria-hidden
          >
            <defs>
              <marker id="sys-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" className="fill-fg-faint" />
              </marker>
            </defs>
            {arch.edges.map((e, i) => {
              const a = byId.get(e.from);
              const b = byId.get(e.to);
              if (!a || !b) return null;
              const s = edgeSegment(a, b);
              const on = !linked || linked.edges.has(i);
              const path = `M${s.x1} ${s.y1} L${s.x2} ${s.y2}`;
              return (
                <g key={i} className={cn('transition-opacity duration-300', on ? 'opacity-100' : 'opacity-15')}>
                  <path
                    d={path}
                    className={linked?.edges.has(i) ? 'stroke-signal-ink' : 'stroke-fg-faint'}
                    strokeWidth={1.25}
                    strokeDasharray="5 4"
                    fill="none"
                    markerEnd="url(#sys-arrow)"
                    style={reduced ? undefined : { animation: 'dash-flow 1.1s linear infinite' }}
                  />
                  {!reduced && (
                    <circle r={2.6} className="fill-signal">
                      <animateMotion dur={`${1.8 + (i % 3) * 0.4}s`} repeatCount="indefinite" path={path} />
                    </circle>
                  )}
                  {e.label && (
                    <text
                      x={(s.x1 + s.x2) / 2}
                      y={(s.y1 + s.y2) / 2 - 7}
                      textAnchor="middle"
                      className="fill-fg-muted font-mono text-[9px]"
                    >
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {arch.nodes.map((n) => {
            const on = !linked || linked.nodes.has(n.id);
            const lifted = hovered === n.id;
            return (
              <div
                key={n.id}
                className="absolute [transform-style:preserve-3d]"
                style={{
                  left: `${(n.x / W) * 100}%`,
                  top: `${(n.y / H) * 100}%`,
                  width: `${(NODE_W / W) * 100}%`,
                  height: `${(NODE_H / H) * 100}%`,
                }}
              >
                {/* shadow on the board, visible when lifted in 3D */}
                <div
                  className={cn(
                    'absolute inset-0 bg-black/40 blur-md transition-opacity duration-700 dark:bg-black/70',
                    is3d ? 'opacity-60' : 'opacity-0'
                  )}
                />
                <button
                  type="button"
                  onMouseEnter={() => onHover(n.id)}
                  onMouseLeave={() => onHover(null)}
                  onFocus={() => onHover(n.id)}
                  onBlur={() => onHover(null)}
                  className={cn(
                    'absolute inset-0 flex flex-col justify-center overflow-hidden border bg-surface pr-2 pl-4 text-left transition-[transform,opacity,border-color] duration-500',
                    on ? 'opacity-100' : 'opacity-30',
                    lifted ? 'border-signal-ink' : 'border-border'
                  )}
                  style={{
                    transform: is3d ? `translateZ(${lifted ? 46 : 26}px)` : lifted ? 'translateY(-2px)' : undefined,
                  }}
                >
                  <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: n.color }} />
                  <span className="truncate text-[12.5px] font-medium text-fg">{n.label}</span>
                  <span className="truncate font-mono text-[10.5px] text-fg-faint">{n.tech}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SystemsContent({ architectures }: { architectures: SystemArchitectureData[] }) {
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [mode, setMode] = useState<'2d' | '3d'>('3d');

  const arch = architectures[selected];

  const breakdown = useMemo(() => {
    if (!arch) return [];
    return arch.nodes.map((n) => ({
      ...n,
      degree: arch.edges.filter((e) => e.from === n.id || e.to === n.id).length,
    }));
  }, [arch]);

  if (!arch) {
    return (
      <div className="container-page">
        <p className="border-y border-line py-20 text-center text-fg-muted">
          Architecture diagrams are being mapped out and will be published soon.
        </p>
      </div>
    );
  }

  return (
    <div className="container-page grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <nav aria-label="Architectures" className="lg:sticky lg:top-24 lg:self-start">
        <p className="label-mono text-fg-faint">Index</p>
        <ol className="mt-4 flex gap-1 overflow-x-auto border-t border-line pt-2 lg:block lg:space-y-0.5 lg:overflow-visible">
          {architectures.map((a, i) => (
            <li key={a.id} className="shrink-0">
              <button
                onClick={() => {
                  setSelected(i);
                  setHovered(null);
                }}
                aria-current={i === selected}
                className={cn(
                  'flex w-full items-baseline gap-3 rounded-[4px] px-2.5 py-2 text-left text-[13px] transition-colors',
                  i === selected ? 'bg-surface text-fg' : 'text-fg-muted hover:text-fg'
                )}
              >
                <span className="font-mono text-[11px] text-fg-faint">{String(i + 1).padStart(2, '0')}</span>
                <span className="whitespace-nowrap lg:whitespace-normal">{a.title.replace(/ Architecture$/, '')}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
          <div>
            <h2 className="text-2xl font-medium tracking-[-0.02em] text-fg">{arch.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">{arch.description}</p>
          </div>
          <div className="flex rounded-[4px] border border-line p-0.5" role="group" aria-label="View">
            {(['2d', '3d'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={cn(
                  'label-mono rounded-[3px] px-3 py-1.5 transition-colors',
                  mode === m ? 'bg-fg text-bg' : 'text-fg-muted hover:text-fg'
                )}
              >
                {m === '2d' ? 'Plan' : 'Exploded'}
              </button>
            ))}
          </div>
        </div>

        <Board arch={arch} mode={mode} hovered={hovered} onHover={setHovered} />

        <p className="label-mono text-fg-faint">Hover a component to trace its connections</p>

        <table className="mt-10 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="label-mono py-2 font-normal text-fg-faint">Component</th>
              <th className="label-mono py-2 font-normal text-fg-faint">Technology</th>
              <th className="label-mono py-2 text-right font-normal text-fg-faint">Links</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((n) => (
              <tr
                key={n.id}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                className={cn('border-b border-line transition-colors', hovered === n.id && 'bg-surface')}
              >
                <td className="py-2.5 pr-4 text-fg">
                  <span className="mr-2.5 inline-block size-2 align-middle" style={{ background: n.color }} />
                  {n.label}
                </td>
                <td className="py-2.5 pr-4 font-mono text-[12px] text-fg-muted">{n.tech}</td>
                <td className="py-2.5 text-right font-mono text-[12px] text-fg-faint">{n.degree}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
