'use client';

import { useMemo, useState } from 'react';
import { replaceLocationHash, useLocationHash, usePrefersReducedMotion } from '@/lib/hooks';
import type { SystemArchitectureData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { FONT, layoutDiagram } from './diagram-layout';

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
  const layout = useMemo(() => layoutDiagram(arch), [arch]);
  const { view } = layout;

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
  /** Diagram units → CSS length. The board is a size container, so text scales with it. */
  const u = (n: number) => `calc(100cqw * ${n} / ${view.w})`;
  const place = (r: { x: number; y: number; w: number; h: number }) => ({
    left: `${((r.x - view.x) / view.w) * 100}%`,
    top: `${((r.y - view.y) / view.h) * 100}%`,
    width: `${(r.w / view.w) * 100}%`,
    height: `${(r.h / view.h) * 100}%`,
  });

  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <div className={cn('min-w-[680px] transition-[padding] duration-700', is3d ? 'pt-6 pb-14' : 'py-8')}>
        <div
          className="relative mx-auto w-full max-w-[900px] [perspective:1600px]"
          style={{ containerType: 'inline-size', perspectiveOrigin: '50% 30%' }}
        >
          <div
            className={cn(
              'relative w-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [transform-style:preserve-3d]',
              is3d && '[transform:rotateX(52deg)_rotateZ(-26deg)_scale(0.82)]'
            )}
            style={{ aspectRatio: `${view.w} / ${view.h}` }}
          >
            {/* the board */}
            <div
              className={cn(
                'absolute inset-0 border border-line bg-blueprint transition-colors duration-700',
                is3d ? 'bg-surface/60' : 'bg-transparent'
              )}
            />

            <svg
              viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
              aria-hidden
            >
              <defs>
                <marker id="sys-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0 0 L10 5 L0 10 z" className="fill-fg-faint" />
                </marker>
              </defs>
              {layout.edges.map((e) => {
                const on = !linked || linked.edges.has(e.index);
                return (
                  <g key={e.index} className={cn('transition-opacity duration-300', on ? 'opacity-100' : 'opacity-15')}>
                    <path
                      d={e.d}
                      className={linked?.edges.has(e.index) ? 'stroke-signal-ink' : 'stroke-fg-faint'}
                      strokeWidth={1.1}
                      strokeDasharray="5 4"
                      fill="none"
                      markerEnd="url(#sys-arrow)"
                      style={reduced ? undefined : { animation: 'dash-flow 1.1s linear infinite' }}
                    />
                    {!reduced && (
                      <circle r={2.4} className="fill-signal">
                        <animateMotion dur={`${1.8 + (e.index % 3) * 0.4}s`} repeatCount="indefinite" path={e.d} />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Edge labels sit above the boxes, placed clear of them (see diagram-layout.ts). */}
            {layout.edges.map((e) =>
              e.label ? (
                <div
                  key={e.index}
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute flex flex-col items-center justify-center rounded-[3px] border bg-bg text-center font-mono whitespace-nowrap transition-[opacity,border-color,color] duration-300',
                    !linked || linked.edges.has(e.index) ? 'opacity-100' : 'opacity-15',
                    linked?.edges.has(e.index) ? 'border-signal-ink/60 text-fg' : 'border-line text-fg-muted'
                  )}
                  style={{
                    ...place(e.label.box),
                    fontSize: u(FONT.edge),
                    lineHeight: 1.25,
                    transform: is3d ? 'translateZ(28px)' : undefined,
                  }}
                >
                  {e.label.lines.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </div>
              ) : null
            )}

            {layout.nodes.map((n) => {
              const on = !linked || linked.nodes.has(n.id);
              const lifted = hovered === n.id;
              return (
                <div key={n.id} className="absolute [transform-style:preserve-3d]" style={place(n.box)}>
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
                    // Touch has no hover: a tap toggles the trace instead.
                    onPointerUp={(ev) => ev.pointerType !== 'mouse' && onHover(lifted ? null : n.id)}
                    className={cn(
                      'absolute inset-0 flex flex-col justify-center overflow-hidden border bg-surface text-left transition-[transform,opacity,border-color] duration-500',
                      on ? 'opacity-100' : 'opacity-30',
                      lifted ? 'border-signal-ink' : 'border-border'
                    )}
                    style={{
                      paddingLeft: u(8),
                      paddingRight: u(4),
                      transform: is3d ? `translateZ(${lifted ? 46 : 26}px)` : lifted ? 'translateY(-2px)' : undefined,
                    }}
                  >
                    <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: n.color }} />
                    <span className="truncate font-medium text-fg" style={{ fontSize: u(FONT.label), lineHeight: 1.3 }}>
                      {n.label}
                    </span>
                    <span className="truncate font-mono text-fg-faint" style={{ fontSize: u(FONT.tech), lineHeight: 1.35 }}>
                      {n.tech}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SystemsContent({ architectures }: { architectures: SystemArchitectureData[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [mode, setMode] = useState<'2d' | '3d'>('3d');

  // The selected diagram lives in the URL (/systems#flex-dca), so it can be linked to.
  const hash = useLocationHash();
  const fromHash = architectures.findIndex((a) => a.architectureId === hash);
  const selected = fromHash === -1 ? 0 : fromHash;
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
                  setHovered(null);
                  replaceLocationHash(a.architectureId);
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

      <div className="relative min-w-0">
        {/* Scroll targets for /systems#<id> links. */}
        {architectures.map((a) => (
          <span key={a.id} id={a.architectureId} aria-hidden className="absolute top-0 scroll-mt-24" />
        ))}

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

        <p className="label-mono text-fg-faint">Hover or tap a component to trace its connections</p>

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
