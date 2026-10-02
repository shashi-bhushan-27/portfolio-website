import type { SystemArchitectureData } from '@/lib/types';

/*
 * Pure layout for the /systems diagrams.
 *
 * Node positions are authored (in SystemArchitecture.nodes) as the top-left of
 * a 130×56 box. Boxes are drawn smaller around the same centres so edges have
 * room for their labels, and the view is cropped to the content.
 */

const AUTHORED_W = 130;
const AUTHORED_H = 56;
export const NODE_W = 104;
export const NODE_H = 46;
const PAD = 26;

/** Font sizes in diagram units; the page scales them with the board via container query units. */
export const FONT = { label: 8.6, tech: 6.9, edge: 6.4 };
const CHAR_W = 0.6; // Geist Mono advance width, in em
const LINE_H = 1.25;
const CHIP_PAD_X = 3;
const CHIP_PAD_Y = 2;

type Pt = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };

export type LaidOutNode = SystemArchitectureData['nodes'][number] & { box: Rect };

export type LaidOutEdge = {
  index: number;
  from: string;
  to: string;
  /** SVG path in diagram units, already clipped to the node borders. */
  d: string;
  label?: { lines: string[]; box: Rect };
};

export type DiagramLayout = {
  view: Rect;
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
};

const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k });
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });

function inflate(r: Rect, m: number): Rect {
  return { x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m };
}

function contains(r: Rect, p: Pt) {
  return p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h;
}

function overlap(a: Rect, b: Rect) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Point on the quadratic curve p0 → c → p2. */
function bezier(p0: Pt, c: Pt, p2: Pt, t: number): Pt {
  const u = 1 - t;
  return { x: u * u * p0.x + 2 * u * t * c.x + t * t * p2.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p2.y };
}

/** Blossom of the quadratic; b(t0, t1) is the control point of the sub-curve between t0 and t1. */
function blossom(p0: Pt, c: Pt, p2: Pt, u: number, v: number): Pt {
  const a = (1 - u) * (1 - v);
  const b = (1 - u) * v + u * (1 - v);
  const d = u * v;
  return { x: a * p0.x + b * c.x + d * p2.x, y: a * p0.y + b * c.y + d * p2.y };
}

/** Last t where the curve is still inside `r` (searching from the start), by bisection. */
function exitT(p0: Pt, c: Pt, p2: Pt, r: Rect, fromEnd: boolean) {
  let inside = fromEnd ? 1 : 0;
  let outside = 0.5;
  for (let i = 0; i < 24; i++) {
    const mid = (inside + outside) / 2;
    if (contains(r, bezier(p0, c, p2, mid))) inside = mid;
    else outside = mid;
  }
  return outside;
}

function chipLayouts(label: string): string[][] {
  const one = [label];
  const words = label.split(' ');
  if (words.length < 2) return [one];
  let best = one;
  let bestMax = Infinity;
  for (let i = 1; i < words.length; i++) {
    const lines = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
    const max = Math.max(...lines.map((l) => l.length));
    if (max < bestMax) {
      bestMax = max;
      best = lines;
    }
  }
  return [one, best];
}

function chipSize(lines: string[]) {
  const longest = Math.max(...lines.map((l) => l.length));
  return {
    w: longest * CHAR_W * FONT.edge + CHIP_PAD_X * 2,
    h: lines.length * LINE_H * FONT.edge + CHIP_PAD_Y * 2,
  };
}

export function layoutDiagram(arch: SystemArchitectureData): DiagramLayout {
  const centres = new Map<string, Pt>(
    arch.nodes.map((n) => [n.id, { x: n.x + AUTHORED_W / 2, y: n.y + AUTHORED_H / 2 }])
  );
  const nodes: LaidOutNode[] = arch.nodes.map((n) => {
    const c = centres.get(n.id)!;
    return { ...n, box: { x: c.x - NODE_W / 2, y: c.y - NODE_H / 2, w: NODE_W, h: NODE_H } };
  });
  const boxOf = new Map(nodes.map((n) => [n.id, n.box]));
  const pairKey = (a: string, b: string) => `${a}\u0000${b}`;
  const directed = new Set(arch.edges.map((e) => pairKey(e.from, e.to)));

  const placedChips: Rect[] = [];
  const edges: LaidOutEdge[] = [];

  arch.edges.forEach((e, index) => {
    const p0 = centres.get(e.from);
    const p2 = centres.get(e.to);
    const fromBox = boxOf.get(e.from);
    const toBox = boxOf.get(e.to);
    if (!p0 || !p2 || !fromBox || !toBox || e.from === e.to) return;

    const dir = sub(p2, p0);
    const len = Math.hypot(dir.x, dir.y) || 1;
    // Unit normal; a reverse edge has the opposite normal, so equal offsets bow the pair apart.
    const normal = { x: -dir.y / len, y: dir.x / len };
    const mid = scale(add(p0, p2), 0.5);
    const others = nodes.filter((n) => n.id !== e.from && n.id !== e.to).map((n) => inflate(n.box, 5));

    const base = directed.has(pairKey(e.to, e.from)) ? 11 : 0;
    const offsets = [0, 26, -26, 44, -44, 64, -64, 88, -88].map((o) => base + o);
    let best = { c: mid, hits: Infinity };
    for (const o of offsets) {
      // The curve's midpoint sits `o` units off the straight line.
      const c = add(mid, scale(normal, 2 * o));
      let hits = 0;
      for (let t = 0.06; t < 0.95; t += 0.03) {
        const p = bezier(p0, c, p2, t);
        if (others.some((r) => contains(r, p))) hits++;
      }
      if (hits < best.hits) best = { c, hits };
      if (hits === 0) break;
    }
    const c = best.c;

    const t0 = exitT(p0, c, p2, inflate(fromBox, 4), false);
    const t1 = exitT(p0, c, p2, inflate(toBox, 4), true);
    if (t1 <= t0) return;
    const s = bezier(p0, c, p2, t0);
    const q = blossom(p0, c, p2, t0, t1);
    const f = bezier(p0, c, p2, t1);
    const d = `M${s.x.toFixed(2)} ${s.y.toFixed(2)} Q${q.x.toFixed(2)} ${q.y.toFixed(2)} ${f.x.toFixed(2)} ${f.y.toFixed(2)}`;

    let label: LaidOutEdge['label'];
    if (e.label) {
      const obstacles = nodes.map((n) => inflate(n.box, 1));
      let fallback: { lines: string[]; box: Rect; cost: number } | null = null;
      search: for (const lines of chipLayouts(e.label)) {
        const size = chipSize(lines);
        for (const at of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74]) {
          const p = bezier(p0, c, p2, t0 + (t1 - t0) * at);
          const box = { x: p.x - size.w / 2, y: p.y - size.h / 2, ...size };
          const cost =
            obstacles.reduce((n, r) => n + overlap(box, r), 0) +
            placedChips.reduce((n, r) => n + overlap(box, inflate(r, 1)), 0);
          if (cost === 0) {
            label = { lines, box };
            break search;
          }
          if (!fallback || cost < fallback.cost) fallback = { lines, box, cost };
        }
      }
      label ??= fallback ? { lines: fallback.lines, box: fallback.box } : undefined;
      if (label) placedChips.push(label.box);
    }

    edges.push({ index, from: e.from, to: e.to, d, label });
  });

  // Crop to everything that is drawn.
  const rects = [...nodes.map((n) => n.box), ...placedChips];
  const minX = Math.min(...rects.map((r) => r.x)) - PAD;
  const minY = Math.min(...rects.map((r) => r.y)) - PAD;
  const maxX = Math.max(...rects.map((r) => r.x + r.w)) + PAD;
  const maxY = Math.max(...rects.map((r) => r.y + r.h)) + PAD;

  return { view: { x: minX, y: minY, w: maxX - minX, h: maxY - minY }, nodes, edges };
}
