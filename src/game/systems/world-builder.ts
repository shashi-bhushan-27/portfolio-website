import { FLOOR, OBJECT, WALL, type FloorStyle, type WallStyle } from '@/game/config/tiles';
import {
  AREAS,
  CORRIDORS,
  NPCS,
  OBJECTS,
  RUG,
  SECRET_WALL,
  WORLD_SIZE,
  type AreaId,
  type Interaction,
  type Rect,
} from '@/game/data/world';

/** Something the player can interact with, resolved to the tile it occupies. */
export type Interactable = {
  id: string;
  label: string;
  action: Interaction;
  x: number;
  y: number;
};

export type BuiltWorld = {
  cols: number;
  rows: number;
  /** Tile indices per layer; -1 is empty. */
  ground: number[][];
  walls: number[][];
  objects: number[][];
  /** Static obstacles (walls + objects). NPCs are added by the scene. */
  blocked: boolean[][];
  areaAt: (AreaId | null)[][];
  /** Keyed by "x,y". */
  interactables: Map<string, Interactable>;
};

const FLOOR_TILES: Record<FloorStyle, [number, number]> = {
  hub: [FLOOR.hub, FLOOR.hubAlt],
  lab: [FLOOR.lab, FLOOR.labAlt],
  garage: [FLOOR.garage, FLOOR.garageAlt],
  wood: [FLOOR.wood, FLOOR.wood],
  arena: [FLOOR.arena, FLOOR.arenaAlt],
  startup: [FLOOR.startup, FLOOR.startup],
  interview: [FLOOR.interview, FLOOR.interview],
  secret: [FLOOR.secret, FLOOR.secretAlt],
  corridor: [FLOOR.corridor, FLOOR.corridor],
};

const WALL_FACE: Record<WallStyle, number> = {
  brick: WALL.brick,
  lab: WALL.lab,
  wood: WALL.wood,
  garage: WALL.garage,
  secret: WALL.secret,
  arena: WALL.arena,
};

export const tileKey = (x: number, y: number) => `${x},${y}`;

const grid = <T,>(cols: number, rows: number, fill: T): T[][] =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));

const eachTile = (r: Rect, fn: (x: number, y: number) => void) => {
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) fn(x, y);
};

/** Cheap, stable per-tile noise so floors vary without looking random on every load. */
const variant = (x: number, y: number) => ((x * 73856093) ^ (y * 19349663)) % 7 === 0;

export function buildWorld(): BuiltWorld {
  const { cols, rows } = WORLD_SIZE;
  const floor = grid<FloorStyle | null>(cols, rows, null);
  const wallStyle = grid<WallStyle | null>(cols, rows, null);
  const areaAt = grid<AreaId | null>(cols, rows, null);

  for (const a of AREAS) {
    eachTile(a.rect, (x, y) => {
      floor[y][x] = a.floor;
      areaAt[y][x] = a.id;
    });
  }
  for (const c of CORRIDORS) eachTile(c, (x, y) => (floor[y][x] ??= 'corridor'));

  const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < cols && y < rows;
  const isFloor = (x: number, y: number) => inBounds(x, y) && floor[y][x] !== null;

  // Walls take the style of the room they face; corridors borrow from their neighbours.
  const styleNear = (x: number, y: number): WallStyle => {
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const a = inBounds(x + dx, y + dy) ? areaAt[y + dy][x + dx] : null;
      if (a) return AREAS.find((r) => r.id === a)!.wall;
    }
    return 'brick';
  };

  const ground = grid(cols, rows, -1);
  const walls = grid(cols, rows, -1);
  const objects = grid(cols, rows, -1);
  const blocked = grid(cols, rows, true);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const f = floor[y][x];
      if (f) {
        const [base, alt] = FLOOR_TILES[f];
        ground[y][x] = variant(x, y) ? alt : base;
        blocked[y][x] = false;
        continue;
      }
      let touchesFloor = false;
      for (let dy = -1; dy <= 1 && !touchesFloor; dy++)
        for (let dx = -1; dx <= 1; dx++) if (isFloor(x + dx, y + dy)) touchesFloor = true;
      if (!touchesFloor) continue;
      wallStyle[y][x] = styleNear(x, y);
      walls[y][x] = isFloor(x, y + 1) ? WALL_FACE[wallStyle[y][x]!] : WALL.top;
    }
  }

  // A wall face reads as a wall only with a top above it.
  for (let y = 1; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const isFace = walls[y][x] !== -1 && walls[y][x] !== WALL.top;
      if (isFace && walls[y - 1][x] === -1 && !isFloor(x, y - 1)) walls[y - 1][x] = WALL.top;
    }
  }

  eachTile(RUG, (x, y) => (ground[y][x] = FLOOR.rug));

  const interactables = new Map<string, Interactable>();

  // The secret passage is floor sealed by a cracked wall until the player breaks through.
  for (const { x, y } of SECRET_WALL) {
    walls[y][x] = WALL.cracked;
    blocked[y][x] = true;
    interactables.set(tileKey(x, y), {
      id: 'cracked-wall',
      label: 'Cracked wall',
      action: { kind: 'secret-wall' },
      x,
      y,
    });
  }

  for (const o of OBJECTS) {
    objects[o.y][o.x] = OBJECT[o.sprite];
    blocked[o.y][o.x] = true;
    if (o.id && o.label && o.action) {
      interactables.set(tileKey(o.x, o.y), { id: o.id, label: o.label, action: o.action, x: o.x, y: o.y });
    }
  }

  return { cols, rows, ground, walls, objects, blocked, areaAt, interactables };
}

/** NPC positions are dynamic (the recruiter moves), so they're interactables the scene adds. */
export const npcInteractable = (id: (typeof NPCS)[number]['id'], name: string, x: number, y: number): Interactable => ({
  id: `npc-${id}`,
  label: `Talk to ${id === 'recruiter' ? 'the Recruiter' : `the ${name}`}`,
  action: { kind: 'npc', id },
  x,
  y,
});
