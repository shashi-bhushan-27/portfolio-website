'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { SystemArchitectureData } from '@/lib/types';
import { Cpu, ChevronRight } from 'lucide-react';

type SystemArchitecture = SystemArchitectureData;

/* ─── Dimensions for the SVG viewBox ─── */
const SVG_W = 620;
const SVG_H = 300;
const NODE_W = 130;
const NODE_H = 56;
const ARROW_ID = 'flow-arrow';

/* ─── Helpers ─── */
function getNodeCenter(node: { x: number; y: number }) {
  return { cx: node.x + NODE_W / 2, cy: node.y + NODE_H / 2 };
}

/** Shorten a line segment so the arrow doesn't overlap the node box */
function clampLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  pad = 8,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { x1, y1, x2, y2 };

  // clamp start to the edge of the source node box
  const startRatio = pad / len;
  // clamp end to the edge of the target node box
  const endRatio = (len - pad) / len;

  return {
    x1: x1 + dx * startRatio,
    y1: y1 + dy * startRatio,
    x2: x1 + dx * endRatio,
    y2: y1 + dy * endRatio,
  };
}

/* ─── SVG Diagram ─── */
function ArchitectureDiagram({
  arch,
  hoveredNode,
  onNodeHover,
}: {
  arch: SystemArchitecture;
  hoveredNode: string | null;
  onNodeHover: (id: string | null) => void;
}) {
  const nodeMap = useMemo(() => {
    const m = new Map<string, (typeof arch.nodes)[0]>();
    arch.nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [arch.nodes]);

  const connectedEdges = useMemo(() => {
    if (!hoveredNode) return new Set<number>();
    const set = new Set<number>();
    arch.edges.forEach((e, i) => {
      if (e.from === hoveredNode || e.to === hoveredNode) set.add(i);
    });
    return set;
  }, [hoveredNode, arch.edges]);

  const connectedNodes = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const set = new Set<string>();
    set.add(hoveredNode);
    arch.edges.forEach((e) => {
      if (e.from === hoveredNode) set.add(e.to);
      if (e.to === hoveredNode) set.add(e.from);
    });
    return set;
  }, [hoveredNode, arch.edges]);

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker
          id={ARROW_ID}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
          fill="currentColor"
          className="text-primary/60"
        >
          <path d="M 0 0 L 10 5 L 0 10 Z" />
        </marker>
      </defs>

      {/* ── Edges ── */}
      {arch.edges.map((edge, i) => {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!from || !to) return null;
        const c1 = getNodeCenter(from);
        const c2 = getNodeCenter(to);
        const clamped = clampLine(c1.cx, c1.cy, c2.cx, c2.cy, 36);
        const mx = (clamped.x1 + clamped.x2) / 2;
        const my = (clamped.y1 + clamped.y2) / 2;

        const isHighlighted = hoveredNode ? connectedEdges.has(i) : true;

        return (
          <g key={`edge-${i}`}>
            <line
              x1={clamped.x1}
              y1={clamped.y1}
              x2={clamped.x2}
              y2={clamped.y2}
              stroke="currentColor"
              className={`transition-opacity duration-300 ${
                isHighlighted
                  ? 'text-muted-foreground/50'
                  : 'text-muted-foreground/10'
              }`}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              markerEnd={`url(#${ARROW_ID})`}
              style={{
                animation: isHighlighted
                  ? 'dash-flow 1s linear infinite'
                  : 'none',
              }}
            />
            {edge.label && (
              <text
                x={mx}
                y={my - 8}
                textAnchor="middle"
                className={`fill-muted-foreground text-[8px] font-mono transition-opacity duration-300 ${
                  isHighlighted ? 'opacity-80' : 'opacity-20'
                }`}
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}

      {/* ── Nodes ── */}
      {arch.nodes.map((node) => {
        const isHighlighted = hoveredNode
          ? connectedNodes.has(node.id)
          : true;

        return (
          <g
            key={node.id}
            onMouseEnter={() => onNodeHover(node.id)}
            onMouseLeave={() => onNodeHover(null)}
            className="cursor-pointer"
          >
            {/* Card shadow */}
            <rect
              x={node.x + 1}
              y={node.y + 2}
              width={NODE_W}
              height={NODE_H}
              rx={10}
              className={`fill-background/80 transition-opacity duration-300 ${
                isHighlighted ? 'opacity-100' : 'opacity-30'
              }`}
            />
            {/* Card bg */}
            <rect
              x={node.x}
              y={node.y}
              width={NODE_W}
              height={NODE_H}
              rx={10}
              className={`fill-card stroke-border transition-all duration-300 ${
                isHighlighted ? 'opacity-100' : 'opacity-30'
              }`}
              strokeWidth={1}
            />
            {/* Color accent bar */}
            <rect
              x={node.x}
              y={node.y}
              width={4}
              height={NODE_H}
              rx={2}
              fill={node.color}
              className={`transition-opacity duration-300 ${
                isHighlighted ? 'opacity-100' : 'opacity-30'
              }`}
            />
            {/* Label */}
            <text
              x={node.x + 14}
              y={node.y + 22}
              className={`fill-foreground text-[10px] font-semibold transition-opacity duration-300 ${
                isHighlighted ? 'opacity-100' : 'opacity-20'
              }`}
            >
              {node.label}
            </text>
            {/* Tech subtitle */}
            <text
              x={node.x + 14}
              y={node.y + 38}
              className={`fill-muted-foreground text-[8px] font-mono transition-opacity duration-300 ${
                isHighlighted ? 'opacity-70' : 'opacity-15'
              }`}
            >
              {node.tech}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Main Component ─── */
export function SystemsContent({ architectures }: { architectures: SystemArchitecture[] }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  if (!architectures || architectures.length === 0) {
    return (
      <section className="section-padding">
        <div className="container-custom text-center py-32">
          <h1 className="text-4xl font-display font-bold mb-4">System Architectures</h1>
          <p className="text-muted-foreground">Detailed system diagrams are currently being mapped out and will be published soon.</p>
        </div>
      </section>
    );
  }

  const arch = architectures[selectedIdx];

  const technologies = useMemo(() => {
    const techs = new Set<string>();
    arch.nodes.forEach((n) => {
      n.tech.split(/[/+,]/).forEach((t) => techs.add(t.trim()));
    });
    return Array.from(techs);
  }, [arch]);

  const handleNodeHover = useCallback((id: string | null) => {
    setHoveredNode(id);
  }, []);

  return (
    <section className="section-padding">
      <div className="container-custom">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <h1 className="text-5xl font-display font-bold tracking-tight mb-4">
            System{' '}
            <span className="gradient-text">Architectures</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Interactive exploration of engineering designs and data flow across
            production systems.
          </p>
        </motion.div>

        {/* ── Mobile tabs ── */}
        <div className="flex md:hidden overflow-x-auto gap-2 pb-4 mb-8 scrollbar-none -mx-1.5 px-1.5">
          {architectures.map((a, i) => (
            <button
              key={a.id}
              onClick={() => {
                setSelectedIdx(i);
                setHoveredNode(null);
              }}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                i === selectedIdx
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {a.title.replace(' Architecture', '')}
            </button>
          ))}
        </div>

        {/* ── Desktop: Sidebar + Main ── */}
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <nav className="sticky top-28 space-y-1">
              {architectures.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setSelectedIdx(i);
                    setHoveredNode(null);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    i === selectedIdx
                      ? 'bg-primary/10 text-primary border-l-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border-l-2 border-transparent'
                  }`}
                >
                  <span className="flex items-center justify-between">
                    {a.title.replace(' Architecture', '')}
                    {i === selectedIdx && (
                      <ChevronRight className="w-3.5 h-3.5 text-primary" />
                    )}
                  </span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={arch.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Title + desc */}
                <div className="mb-6">
                  <h2 className="text-2xl font-display font-semibold tracking-tight mb-2">
                    {arch.title}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {arch.description}
                  </p>
                </div>

                {/* Diagram */}
                <div className="bg-card/50 border border-border/50 rounded-2xl p-4 md:p-8 min-h-[500px] flex items-center justify-center mb-8 overflow-hidden">
                  <ArchitectureDiagram
                    arch={arch}
                    hoveredNode={hoveredNode}
                    onNodeHover={handleNodeHover}
                  />
                </div>

                {/* Hint */}
                <p className="text-xs text-muted-foreground/60 mb-8 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  Hover over nodes to trace data flow connections
                </p>

                {/* Technologies */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Technology Breakdown
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 rounded-lg bg-muted/50 text-xs font-mono text-muted-foreground border border-border/30"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Dash animation */}
      <style jsx global>{`
        @keyframes dash-flow {
          to {
            stroke-dashoffset: -20;
          }
        }
      `}</style>
    </section>
  );
}
