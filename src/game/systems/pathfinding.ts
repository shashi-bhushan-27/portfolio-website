/**
 * Grid A* with 4-way moves and a Manhattan heuristic. Used for tap-to-move in the
 * world and for the indoor-navigation demo — the same algorithm the indoor
 * positioning system uses to route people through a floor plan.
 */

export type Point = { x: number; y: number };

export function findPath(
  blocked: (x: number, y: number) => boolean,
  cols: number,
  rows: number,
  start: Point,
  goal: Point
): Point[] | null {
  if (blocked(goal.x, goal.y)) return null;
  const idx = (x: number, y: number) => y * cols + x;
  const g = new Map<number, number>([[idx(start.x, start.y), 0]]);
  const from = new Map<number, number>();
  const h = (x: number, y: number) => Math.abs(x - goal.x) + Math.abs(y - goal.y);

  // A binary heap would be faster; open sets here stay in the low hundreds.
  const open: { i: number; f: number }[] = [{ i: idx(start.x, start.y), f: h(start.x, start.y) }];
  const closed = new Set<number>();

  while (open.length) {
    let best = 0;
    for (let k = 1; k < open.length; k++) if (open[k].f < open[best].f) best = k;
    const { i } = open.splice(best, 1)[0];
    if (closed.has(i)) continue;
    closed.add(i);

    const x = i % cols;
    const y = (i - x) / cols;
    if (x === goal.x && y === goal.y) {
      const path: Point[] = [];
      for (let c: number | undefined = i; c !== undefined; c = from.get(c)) {
        path.push({ x: c % cols, y: Math.floor(c / cols) });
      }
      return path.reverse();
    }

    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || blocked(nx, ny)) continue;
      const ni = idx(nx, ny);
      const cost = g.get(i)! + 1;
      if (cost < (g.get(ni) ?? Infinity)) {
        g.set(ni, cost);
        from.set(ni, i);
        open.push({ i: ni, f: cost + h(nx, ny) });
      }
    }
  }
  return null;
}

/** The free tile next to `target` that is closest to `from` — where to stand to interact. */
export function standingSpot(
  blocked: (x: number, y: number) => boolean,
  target: Point,
  from: Point
): Point | null {
  const options = [
    { x: target.x, y: target.y + 1 },
    { x: target.x - 1, y: target.y },
    { x: target.x + 1, y: target.y },
    { x: target.x, y: target.y - 1 },
  ].filter((p) => !blocked(p.x, p.y));
  options.sort(
    (a, b) => Math.abs(a.x - from.x) + Math.abs(a.y - from.y) - (Math.abs(b.x - from.x) + Math.abs(b.y - from.y))
  );
  return options[0] ?? null;
}
