/**
 * Generates the SHASHI.EXE pixel art into public/game/ — tileset, player, NPCs, UI —
 * plus a full-map render for the README. Every sprite is defined here, so the art is
 * reproducible and reviewable in diffs.
 *
 *   npm run game:assets            write assets
 *   npm run game:assets -- --preview   also write an enlarged contact sheet to .game-preview/
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { FLOOR, NPC_SPRITES, OBJECT, TILESET_COLUMNS, WALL } from '../src/game/config/tiles';
import { buildWorld } from '../src/game/systems/world-builder';
import { NPCS, SPAWN } from '../src/game/data/world';
import { npcFrame } from '../src/game/config/tiles';

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'game');
const T = 16;

/* ───────────────────────── PNG encoding ───────────────────────── */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf: Buffer) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, data: Buffer) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

class Bitmap {
  readonly data: Uint8Array;
  constructor(
    readonly width: number,
    readonly height: number
  ) {
    this.data = new Uint8Array(width * height * 4);
  }
  set(x: number, y: number, [r, g, b, a]: RGBA) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height || a === 0) return;
    const i = (y * this.width + x) * 4;
    if (a === 255 || this.data[i + 3] === 0) {
      this.data.set([r, g, b, a], i);
      return;
    }
    // Alpha-blend over what's there (used for soft shadows).
    const t = a / 255;
    this.data[i] = Math.round(r * t + this.data[i] * (1 - t));
    this.data[i + 1] = Math.round(g * t + this.data[i + 1] * (1 - t));
    this.data[i + 2] = Math.round(b * t + this.data[i + 2] * (1 - t));
    this.data[i + 3] = Math.max(this.data[i + 3], a);
  }
  get(x: number, y: number): RGBA {
    const i = (y * this.width + x) * 4;
    return [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]];
  }
  blit(src: Bitmap, ox: number, oy: number) {
    for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) this.set(ox + x, oy + y, src.get(x, y));
  }
  scaled(k: number) {
    const out = new Bitmap(this.width * k, this.height * k);
    for (let y = 0; y < out.height; y++)
      for (let x = 0; x < out.width; x++) out.set(x, y, this.get(Math.floor(x / k), Math.floor(y / k)));
    return out;
  }
  png() {
    const stride = this.width * 4 + 1;
    const raw = Buffer.alloc(stride * this.height);
    for (let y = 0; y < this.height; y++) {
      raw[y * stride] = 0;
      Buffer.from(this.data.buffer, y * this.width * 4, this.width * 4).copy(raw, y * stride + 1);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.width, 0);
    ihdr.writeUInt32BE(this.height, 4);
    ihdr.set([8, 6, 0, 0, 0], 8);
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

/* ───────────────────────── Palette ───────────────────────── */

type RGBA = [number, number, number, number];
const hex = (h: string, a = 255): RGBA => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
  a,
];

// One character per colour, so sprites can be drawn as text.
const PALETTE: Record<string, RGBA> = {
  '.': [0, 0, 0, 0],
  '~': [0, 0, 0, 90],
  '0': hex('#0b0d10'),
  '1': hex('#161a20'),
  '2': hex('#20252d'),
  '3': hex('#2c323c'),
  '4': hex('#3c434f'),
  '5': hex('#5a6370'),
  '6': hex('#87909c'),
  '7': hex('#bfc5ce'),
  '8': hex('#eef1f4'),
  a: hex('#c5ee4f'), // the site's signal lime
  A: hex('#86ad22'),
  z: hex('#3f5a0c'),
  b: hex('#4a90e2'),
  B: hex('#23477a'),
  c: hex('#6fe3f2'),
  C: hex('#23798c'),
  o: hex('#f0a03c'),
  O: hex('#a35d1b'),
  y: hex('#f6d55c'),
  Y: hex('#b0861f'),
  r: hex('#e5534b'),
  R: hex('#8c2a2a'),
  p: hex('#a98be8'),
  P: hex('#57399a'),
  w: hex('#9b6a43'),
  W: hex('#6a4429'),
  k: hex('#b47b52'),
  K: hex('#87583a'),
  h: hex('#1e1816'),
  H: hex('#4a3226'),
  g: hex('#3fb37f'),
  G: hex('#1d6a48'),
  n: hex('#e3d3ae'),
  N: hex('#b3a27c'),
  '9': hex('#101824'),
  L: hex('#1a2638'),
  v: hex('#251d2e'),
  V: hex('#33283f'),
  e: hex('#2b2420'),
  E: hex('#352c27'),
  i: hex('#1c2230'),
  I: hex('#232b3c'),
};

const sprite = (rows: string[], swap: Record<string, string> = {}) => {
  if (rows.length !== T) throw new Error(`sprite needs ${T} rows, got ${rows.length}`);
  const bmp = new Bitmap(T, T);
  rows.forEach((row, y) => {
    if (row.length !== T) throw new Error(`row ${y} is ${row.length} wide: "${row}"`);
    [...row].forEach((ch, x) => {
      const key = swap[ch] ?? ch;
      const color = PALETTE[key];
      if (!color) throw new Error(`unknown palette key "${key}"`);
      bmp.set(x, y, color);
    });
  });
  return bmp;
};

/** Procedural tile: fill, then let `paint` add detail. */
const tile = (fill: string, paint?: (put: (x: number, y: number, c: string) => void) => void) => {
  const bmp = new Bitmap(T, T);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) bmp.set(x, y, PALETTE[fill]);
  paint?.((x, y, c) => {
    bmp.data.fill(0, (y * T + x) * 4, (y * T + x) * 4 + 4);
    bmp.set(x, y, PALETTE[c]);
  });
  return bmp;
};

const seams = (put: (x: number, y: number, c: string) => void, c: string) => {
  for (let i = 0; i < T; i++) {
    put(i, 0, c);
    put(0, i, c);
  }
};

/* ───────────────────────── Floors ───────────────────────── */

const floors: Record<number, Bitmap> = {
  [FLOOR.hub]: tile('2', (p) => {
    seams(p, '1');
    p(5, 6, '3');
    p(11, 12, '3');
  }),
  [FLOOR.hubAlt]: tile('2', (p) => {
    seams(p, '1');
    for (let i = 5; i <= 10; i++) {
      p(i, 7, '3');
      p(i, 8, '3');
    }
  }),
  [FLOOR.lab]: tile('9', (p) => seams(p, 'L')),
  [FLOOR.labAlt]: tile('9', (p) => {
    seams(p, 'L');
    for (let x = 1; x <= 9; x++) p(x, 8, 'C');
    for (let y = 8; y <= 15; y++) p(9, y, 'C');
    p(9, 8, 'c');
    p(4, 8, 'c');
  }),
  [FLOOR.garage]: tile('3', (p) => {
    seams(p, '2');
    [[3, 4], [10, 2], [6, 11], [13, 9], [2, 13]].forEach(([x, y]) => p(x, y, '4'));
  }),
  [FLOOR.garageAlt]: tile('3', (p) => {
    seams(p, '2');
    // An oil stain.
    for (const [x, y] of [[6, 6], [7, 6], [8, 6], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [6, 8], [7, 8], [8, 8], [7, 9]])
      p(x, y, '2');
  }),
  [FLOOR.wood]: tile('w', (p) => {
    for (const y of [3, 7, 11, 15]) for (let x = 0; x < T; x++) p(x, y, 'W');
    [[5, 0], [12, 4], [2, 8], [9, 12]].forEach(([x, y0]) => {
      for (let y = y0; y < y0 + 3; y++) p(x, y, 'W');
    });
    [[1, 1], [8, 5], [14, 9], [5, 13]].forEach(([x, y]) => p(x, y, 'n'));
  }),
  [FLOOR.arena]: tile('v', (p) => seams(p, 'V')),
  [FLOOR.arenaAlt]: tile('V', (p) => {
    seams(p, 'P');
    p(7, 7, 'P');
    p(8, 8, 'P');
  }),
  [FLOOR.startup]: tile('e', (p) => {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if ((x * 3 + y * 5) % 7 === 0) p(x, y, 'E');
  }),
  [FLOOR.interview]: tile('i', (p) => {
    for (let k = 0; k < T; k++) {
      p(k, k, 'I');
      p((k + 8) % T, k, 'I');
    }
  }),
  [FLOOR.secret]: tile('0', (p) => seams(p, 'z')),
  [FLOOR.secretAlt]: tile('0', (p) => {
    seams(p, 'z');
    for (const [x, y] of [[7, 7], [8, 7], [7, 8], [8, 8]]) p(x, y, 'A');
  }),
  [FLOOR.corridor]: tile('2', (p) => {
    seams(p, '1');
    p(7, 7, 'z');
    p(8, 8, 'z');
  }),
  [FLOOR.rug]: tile('B', (p) => {
    for (let k = 0; k < 8; k++) {
      p(7 - k, k, 'b');
      p(8 + k, k, 'b');
      p(7 - k, 15 - k, 'b');
      p(8 + k, 15 - k, 'b');
    }
    p(7, 7, 'c');
    p(8, 8, 'c');
  }),
};

/* ───────────────────────── Walls ───────────────────────── */

const brickFace = (base: string, mortar: string, cap: string) =>
  tile(base, (p) => {
    for (let x = 0; x < T; x++) {
      p(x, 0, cap);
      p(x, 1, cap);
      p(x, 15, '1');
    }
    for (const y of [5, 9, 13]) for (let x = 0; x < T; x++) p(x, y, mortar);
    [[2, 4], [6, 8], [10, 12]].forEach(([y0, y1], row) => {
      const xs = row % 2 ? [3, 11] : [7, 15];
      for (const x of xs) for (let y = y0; y <= y1; y++) p(x, y, mortar);
    });
  });

const walls: Record<number, Bitmap> = {
  [WALL.top]: tile('1', (p) => {
    for (let x = 0; x < T; x++) p(x, 15, '3');
  }),
  [WALL.brick]: brickFace('4', '3', '5'),
  [WALL.lab]: tile('L', (p) => {
    for (let x = 0; x < T; x++) {
      p(x, 0, '4');
      p(x, 1, '4');
      p(x, 7, 'C');
      p(x, 8, 'c');
      p(x, 15, '0');
    }
    for (let y = 2; y < 15; y++) p(7, y, 'B');
  }),
  [WALL.wood]: tile('W', (p) => {
    for (let x = 0; x < T; x++) {
      p(x, 0, 'w');
      p(x, 1, 'w');
      p(x, 9, 'n');
      p(x, 15, '0');
    }
    for (const x of [3, 7, 11, 15]) for (let y = 2; y < 9; y++) p(x, y, 'H');
    for (let y = 10; y < 15; y++) for (let x = 0; x < T; x++) p(x, y, 'w');
  }),
  [WALL.garage]: tile('4', (p) => {
    for (let x = 0; x < T; x++) {
      p(x, 0, '5');
      p(x, 1, '5');
      p(x, 15, '1');
    }
    for (let x = 1; x < T; x += 2) for (let y = 2; y < 10; y++) p(x, y, '3');
    for (let y = 11; y <= 13; y++) for (let x = 0; x < T; x++) p(x, y, (x + y) % 4 < 2 ? 'y' : '1');
  }),
  [WALL.cracked]: (() => {
    const b = brickFace('4', '3', '5');
    const crack = [[7, 1], [7, 2], [8, 3], [8, 4], [7, 5], [6, 6], [6, 7], [7, 8], [8, 9], [9, 10], [9, 11], [8, 12], [8, 13], [9, 14]];
    for (const [x, y] of crack) b.set(x, y, PALETTE['0']);
    for (const [x, y] of [[10, 6], [11, 7], [5, 10], [4, 11]]) b.set(x, y, PALETTE['1']);
    return b;
  })(),
  [WALL.secret]: tile('1', (p) => {
    for (let x = 0; x < T; x++) {
      p(x, 0, '2');
      p(x, 1, '2');
      p(x, 15, '0');
    }
    for (const x of [3, 12]) for (let y = 2; y < 15; y++) p(x, y, 'z');
    p(3, 7, 'A');
    p(12, 9, 'A');
  }),
  [WALL.arena]: (() => {
    const b = brickFace('4', '3', '5');
    for (let y = 6; y <= 8; y++) for (let x = 0; x < T; x++) b.set(x, y, PALETTE[y === 7 ? 'r' : 'R']);
    return b;
  })(),
};

/* ───────────────────────── Objects ───────────────────────── */

const TERMINAL = [
  '................',
  '..000000000000..',
  '..022222222220..',
  '..021111111120..',
  '..021aaaa11120..',
  '..0211111a1120..',
  '..021aa1aaa120..',
  '..021111111120..',
  '..021aaa1a1120..',
  '..022222222220..',
  '..000000000000..',
  '......0440......',
  '....00444400....',
  '...0455555540...',
  '...0444444440...',
  '...0000000000...',
];

const objects: Record<number, Bitmap> = {
  [OBJECT.terminalLime]: sprite(TERMINAL),
  [OBJECT.terminalCyan]: sprite(TERMINAL, { a: 'c' }),
  [OBJECT.terminalOrange]: sprite(TERMINAL, { a: 'o' }),
  [OBJECT.terminalPurple]: sprite(TERMINAL, { a: 'p' }),
  [OBJECT.oldTerminal]: sprite(
    [
      '................',
      '...0000000000...',
      '..0NNNNNNNNNN0..',
      '..0N00000000N0..',
      '..0N0a0aa000N0..',
      '..0N0000a000N0..',
      '..0N0aa0a0a0N0..',
      '..0N00000000N0..',
      '..0NNNNNNNNNN0..',
      '..0nnnnnnnnnn0..',
      '..000000000000..',
      '.0nnnnnnnnnnnn0.',
      '.0N6N6N6N6N6NN0.',
      '.0NNNNNNNNNNNN0.',
      '.00000000000000.',
      '................',
    ]
  ),
  [OBJECT.serverRack]: sprite([
    '...0000000000...',
    '...0444444440...',
    '...0433333340...',
    '...043a3c33340..',
    '...0433333340...',
    '...0444444440...',
    '...0433333340...',
    '...043c3a3340...',
    '...0433333340...',
    '...0444444440...',
    '...0433333340...',
    '...043a3a3340...',
    '...0433333340...',
    '...0444444440...',
    '...0555555550...',
    '...0000000000...',
  ].map((r) => r.slice(0, 16))),
  [OBJECT.desk]: sprite([
    '................',
    '................',
    '................',
    '................',
    '0000000000000000',
    '0wwwwwwwwwwwwww0',
    '0wnnwwwwwwwwwww0',
    '0WWWWWWWWWWWWWW0',
    '0W000000000000W0',
    '0W0..........0W0',
    '0W0..........0W0',
    '0W0..........0W0',
    '0W0..........0W0',
    '000..........000',
    '................',
    '................',
  ]),
  [OBJECT.deskComputer]: sprite([
    '...0000000000...',
    '...0111111110...',
    '...01cccccc10...',
    '...01c1c11c10...',
    '...01cccccc10...',
    '0000000440000000',
    '0wwwwww44wwwwww0',
    '0wnnwwwwwwww88w0',
    '0WWWWWWWWWWWWWW0',
    '0W000000000000W0',
    '0W0..........0W0',
    '0W0..........0W0',
    '0W0..........0W0',
    '000..........000',
    '................',
    '................',
  ]),
  [OBJECT.chair]: sprite([
    '................',
    '................',
    '................',
    '.....000000.....',
    '.....044440.....',
    '.....044440.....',
    '.....044440.....',
    '....00000000....',
    '....05555550....',
    '....04444440....',
    '....00000000....',
    '.....0....0.....',
    '.....0....0.....',
    '....00....00....',
    '................',
    '................',
  ]),
  [OBJECT.plant]: sprite([
    '................',
    '.......0g0......',
    '....0g0gg00g0...',
    '...0gg0gG0gg0...',
    '....0gGgGgG0....',
    '..0g0GgGgGg0g0..',
    '..0ggGgGGgGgg0..',
    '...0GgGggGgG0...',
    '....0GGgGgG0....',
    '.....000000.....',
    '.....0OOOO0.....',
    '.....0wwww0.....',
    '.....0OOOO0.....',
    '......0000......',
    '................',
    '................',
  ]),
  [OBJECT.bookshelf]: sprite([
    '.00000000000000.',
    '.0WWWWWWWWWWWW0.',
    '.0W0rr0bb0yy0W0.',
    '.0W0rr0bb0yy0W0.',
    '.0W0rr0bb0yy0W0.',
    '.0WWWWWWWWWWWW0.',
    '.0W0gg0pp0nn0W0.',
    '.0W0gg0pp0nn0W0.',
    '.0W0gg0pp0nn0W0.',
    '.0WWWWWWWWWWWW0.',
    '.0W0bb0oo0rr0W0.',
    '.0W0bb0oo0rr0W0.',
    '.0W0bb0oo0rr0W0.',
    '.0WWWWWWWWWWWW0.',
    '.00000000000000.',
    '................',
  ]),
  [OBJECT.machine]: sprite([
    '................',
    '....00000000....',
    '...0444444440...',
    '...043cccc340...',
    '...043c11c340...',
    '...043cccc340...',
    '...0444444440...',
    '...04a4o4r440...',
    '...0444444440...',
    '..000000000000..',
    '..0y1y1y1y1y10..',
    '..01y1y1y1y1y0..',
    '..055555555550..',
    '..044444444440..',
    '..000000000000..',
    '................',
  ]),
  [OBJECT.machineAlt]: sprite([
    '................',
    '.....000000.....',
    '....04444440....',
    '...0455555540...',
    '...04aAaAaA40...',
    '...04AaAaAa40...',
    '...04aAaAaA40...',
    '...0455555540...',
    '...0444444440...',
    '..000000000000..',
    '..0y1y1y1y1y10..',
    '..01y1y1y1y1y0..',
    '..055555555550..',
    '..044444444440..',
    '..000000000000..',
    '................',
  ]),
  [OBJECT.floorPlan]: sprite([
    '........a.......',
    '........0.......',
    '.......000......',
    '..000000000000..',
    '..0BBBBBBBBBB0..',
    '..0BbbbBbbbbB0..',
    '..0BbBBbBBBbB0..',
    '..0BbBaBBBBbB0..',
    '..0BbbbbbBbbB0..',
    '..0BBBBBBBBBB0..',
    '..000000000000..',
    '..0W00000000W0..',
    '..0W0......0W0..',
    '..0W0......0W0..',
    '..000......000..',
    '................',
  ]),
  [OBJECT.trophyGold]: sprite([
    '................',
    '...0000000000...',
    '..0yyyyyyyyyY0..',
    '.0y0yyyyyyyY0y0.',
    '.0y0yyyyyyyY0y0.',
    '..00yyyyyyyY00..',
    '....0yyyyyY0....',
    '.....0yyyY0.....',
    '......0YY0......',
    '......0yY0......',
    '.....0yyyY0.....',
    '...0000000000...',
    '...0WWWWWWWW0...',
    '...0WwwwwwwW0...',
    '...0WWWWWWWW0...',
    '...0000000000...',
  ]),
  [OBJECT.trophySilver]: sprite(
    [
      '................',
      '...0000000000...',
      '..0yyyyyyyyyY0..',
      '.0y0yyyyyyyY0y0.',
      '.0y0yyyyyyyY0y0.',
      '..00yyyyyyyY00..',
      '....0yyyyyY0....',
      '.....0yyyY0.....',
      '......0YY0......',
      '......0yY0......',
      '.....0yyyY0.....',
      '...0000000000...',
      '...0WWWWWWWW0...',
      '...0WwwwwwwW0...',
      '...0WWWWWWWW0...',
      '...0000000000...',
    ],
    { y: '7', Y: '6' }
  ),
  [OBJECT.plaque]: sprite([
    '................',
    '..000000000000..',
    '..0YYYYYYYYYY0..',
    '..0YWWWWWWWWY0..',
    '..0YWyyyyyyWY0..',
    '..0YWWWWWWWWY0..',
    '..0YWnnnnnnWY0..',
    '..0YWWWWWWWWY0..',
    '..0YWnnnnWWWY0..',
    '..0YWWWWWWWWY0..',
    '..0YYYYYYYYYY0..',
    '..000000000000..',
    '......0WW0......',
    '......0WW0......',
    '....00000000....',
    '................',
  ]),
  [OBJECT.coffee]: sprite([
    '...0000000000...',
    '...0555555550...',
    '...0577777750...',
    '...05r0000r50...',
    '...0577777750...',
    '...0555555550...',
    '...0550000550...',
    '...055.......0..',
    '...055.0880..0..',
    '...055.0W80.50..',
    '...055.0880.50..',
    '...0550000005...',
    '...0555555550...',
    '...0444444440...',
    '...0000000000...',
    '................',
  ].map((r) => r.padEnd(16, '.').slice(0, 16))),
  [OBJECT.duck]: sprite([
    '................',
    '................',
    '................',
    '................',
    '................',
    '.......000......',
    '......0yyy0.....',
    '......0y0y0o....',
    '......0yyyoo0...',
    '..00...0yy00....',
    '.0yy0000yyy0....',
    '.0yyyyyyyyyy0...',
    '..0yyyyyyyyY0...',
    '...0YyyyyyY0....',
    '....00000000....',
    '................',
  ]),
  [OBJECT.whiteboard]: sprite([
    '0000000000000000',
    '0666666666666660',
    '0688888888888860',
    '068bb8b8888r8860',
    '0688888b88r88860',
    '068888888r888860',
    '0688a88888888860',
    '0688aa8888bbb860',
    '0688888888888860',
    '0666666666666660',
    '0000000000000000',
    '...0........0...',
    '...0........0...',
    '...0........0...',
    '..000......000..',
    '................',
  ]),
  [OBJECT.sofa]: sprite([
    '................',
    '................',
    '................',
    '..000000000000..',
    '..0PPPPPPPPPP0..',
    '..0PppppppppP0..',
    '..0PppppppppP0..',
    '00PPPPPPPPPPPP00',
    '0PP0pppppppp0PP0',
    '0PP0pppppppp0PP0',
    '0PP0PPPPPPPP0PP0',
    '0PPPPPPPPPPPPPP0',
    '0000000000000000',
    '.00..........00.',
    '................',
    '................',
  ]),
  [OBJECT.pillar]: sprite([
    '...0000000000...',
    '...0777777770...',
    '...0666666660...',
    '....06777760....',
    '....06767760....',
    '....06767760....',
    '....06767760....',
    '....06767760....',
    '....06767760....',
    '....06767760....',
    '....06767760....',
    '....06777760....',
    '...0666666660...',
    '...0777777770...',
    '...0555555550...',
    '...0000000000...',
  ]),
  [OBJECT.questBoard]: sprite([
    '0000000000000000',
    '0WWWWWWWWWWWWWW0',
    '0WwwwwwwwwwwwwW0',
    '0Ww8888ww8888wW0',
    '0Ww8NN8ww8NN8wW0',
    '0Ww8888ww8888wW0',
    '0Wwwrwwwwwwywww0',
    '0Ww8888ww8888wW0',
    '0Ww8NN8ww8NN8wW0',
    '0Ww8888ww8888wW0',
    '0WwwwwwwwwwwwwW0',
    '0WWWWWWWWWWWWWW0',
    '0000000000000000',
    '...0W0....0W0...',
    '...0W0....0W0...',
    '..000......000..',
  ]),
  [OBJECT.sign]: sprite([
    '................',
    '................',
    '.00000000000000.',
    '.0wwwwwwwwwwww0.',
    '.0wnnnnnnnnnnw0.',
    '.0wWWWWWWWWWWw0.',
    '.0wnnnnnnnnnnw0.',
    '.0wWWWWWWW.WWw0.',
    '.0wwwwwwwwwwww0.',
    '.00000000000000.',
    '.......0W0......',
    '.......0W0......',
    '.......0W0......',
    '......0WWW0.....',
    '......00000.....',
    '................',
  ].map((r) => r.replace('.WW', 'WWW'))),
  [OBJECT.lavaLamp]: sprite([
    '................',
    '......0000......',
    '......0550......',
    '.....0paap0.....',
    '.....0pppa0.....',
    '.....0pa pp0....',
    '.....0ppppp0....',
    '.....0papap0....',
    '.....0ppaap0....',
    '.....0ppppp0....',
    '......0pp0......',
    '.....055550.....',
    '....05555550....',
    '....04444440....',
    '....00000000....',
    '................',
  ].map((r) => r.replace(' ', 'p').padEnd(16, '.').slice(0, 16))),
  [OBJECT.crate]: sprite([
    '................',
    '................',
    '.00000000000000.',
    '.0WwwwwwwwwwwW0.',
    '.0wWwwwwwwwwWw0.',
    '.0wwWwwwwwwWww0.',
    '.0wwwWwwwwWwww0.',
    '.0wwwwWwwWwwww0.',
    '.0wwwwwWWwwwww0.',
    '.0wwwwWwwWwwww0.',
    '.0wwwWwwwwWwww0.',
    '.0wwWwwwwwwWww0.',
    '.0wWwwwwwwwwWw0.',
    '.0WwwwwwwwwwwW0.',
    '.00000000000000.',
    '................',
  ]),
  [OBJECT.pingPong]: sprite([
    '................',
    '................',
    '................',
    '0000000000000000',
    '0GGGGGGG8GGGGGG0',
    '0GgggggG8GgggggG0',
    '0GgggggG8GgggggG0',
    '088888888888888 0',
    '0GgggggG8GgggggG0',
    '0GgggggG8GgggggG0',
    '0GGGGGGG8GGGGGG0',
    '0000000000000000',
    '.0............0.',
    '.0............0.',
    '.0............0.',
    '................',
  ].map((r) => r.replace(/ /g, '').replace('GgggggG8GgggggG0', 'gggggG8GgggggG0').padEnd(16, '.').slice(0, 16))),
  [OBJECT.waterCooler]: sprite([
    '.....000000.....',
    '....0cccccc0....',
    '....0cCcccc0....',
    '....0cCcccc0....',
    '....0cccccc0....',
    '.....000000.....',
    '....08888880....',
    '....08000080....',
    '....08b88880....',
    '....08888880....',
    '....08888880....',
    '....07777770....',
    '....07777770....',
    '....06666660....',
    '....00000000....',
    '................',
  ]),
  [OBJECT.certificates]: sprite([
    '................',
    '0000000.0000000.',
    '0YnnnY0.0YnnnY0.',
    '0nNNNn0.0nNNNn0.',
    '0nnnnn0.0nnnnn0.',
    '0nNNnn0.0nNNnn0.',
    '0nnrrn0.0nnbbn0.',
    '0YnnnY0.0YnnnY0.',
    '0000000.0000000.',
    '................',
    '...0WWWWWWWW0...',
    '...0WwwwwwwW0...',
    '...0W000000W0...',
    '...0W0....0W0...',
    '...000....000...',
    '................',
  ]),
  [OBJECT.bigScreen]: sprite([
    '0000000000000000',
    '0111111111111110',
    '01aa111111111110',
    '01aaaa1111c11110',
    '01111aa11cc11110',
    '011111aacc111110',
    '0111111aa1111110',
    '0111111111a11110',
    '0111111111aa1110',
    '0111111111111110',
    '0000000000000000',
    '.......00.......',
    '.......00.......',
    '......0440......',
    '.....000000.....',
    '................',
  ]),
  [OBJECT.banner]: sprite([
    '..000000000000..',
    '..0RRRRRRRRRR0..',
    '..0RrrrrrrrrR0..',
    '..0Rr0rr0rrrR0..',
    '..0Rrrr00rrrR0..',
    '..0Rr0rr0rrrR0..',
    '..0RrrrrrrrrR0..',
    '..0RryyyyyyrR0..',
    '..0RrrrrrrrrR0..',
    '..0RRRRRRRRRR0..',
    '..0RRR0000RRR0..',
    '..0RR0....0RR0..',
    '..000......000..',
    '................',
    '................',
    '................',
  ]),
  [OBJECT.learningBoard]: sprite([
    '0000000000000000',
    '0WWWWWWWWWWWWWW0',
    '0W111111111111W0',
    '0W1a1aaaa11111W0',
    '0W111111111111W0',
    '0W1a1aaaaaa111W0',
    '0W111111111111W0',
    '0W1a1aaa111111W0',
    '0W111111111111W0',
    '0W1a1aaaaa1111W0',
    '0W111111111111W0',
    '0WWWWWWWWWWWWWW0',
    '0000000000000000',
    '...0W0....0W0...',
    '...0W0....0W0...',
    '..000......000..',
  ]),
};

/* ───────────────────────── Characters ───────────────────────── */

type Look = {
  skin: string;
  skinShadow: string;
  hair: string;
  top: string;
  topLight: string;
  topShadow: string;
  pants: string;
  shoes: string;
  pack?: string;
  packLight?: string;
  hairStyle?: 'short' | 'bun' | 'grey' | 'cap';
  headband?: string;
  cap?: string;
  belt?: string;
  holding?: 'clipboard' | 'coffee' | 'laptop';
};

/** Draws a 16×16 character, then outlines the silhouette. */
function character(look: Look, dir: 'down' | 'up' | 'side', frame: 0 | 1 | 2) {
  const px: Record<string, string> = {};
  const put = (x: number, y: number, c: string) => (px[`${x},${y}`] = c);
  const row = (y: number, x0: number, x1: number, c: string) => {
    for (let x = x0; x <= x1; x++) put(x, y, c);
  };

  // Head
  if (dir === 'down') {
    row(1, 6, 9, look.hair);
    row(2, 5, 10, look.hair);
    row(3, 4, 11, look.hair);
    row(4, 4, 11, look.skin);
    put(4, 4, look.hair);
    put(11, 4, look.hair);
    row(4, 5, 7, look.hair); // fringe
    row(5, 5, 10, look.skin);
    put(4, 5, look.hair);
    put(11, 5, look.hair);
    put(6, 5, '0');
    put(9, 5, '0');
    row(6, 5, 10, look.skin);
    put(5, 6, look.skinShadow);
    put(10, 6, look.skinShadow);
    row(7, 6, 9, look.skinShadow);
  } else if (dir === 'up') {
    row(1, 6, 9, look.hair);
    row(2, 5, 10, look.hair);
    for (let y = 3; y <= 6; y++) row(y, 4, 11, look.hair);
    row(7, 6, 9, look.skinShadow);
  } else {
    row(1, 6, 9, look.hair);
    row(2, 5, 10, look.hair);
    row(3, 4, 10, look.hair);
    row(4, 4, 6, look.hair);
    row(4, 7, 10, look.skin);
    row(5, 4, 6, look.hair);
    row(5, 7, 10, look.skin);
    put(11, 5, look.skin);
    put(9, 5, '0');
    put(5, 6, look.hair);
    row(6, 6, 10, look.skin);
    row(7, 7, 9, look.skinShadow);
  }

  // Hair styles and headwear
  if (look.hairStyle === 'bun') {
    if (dir === 'side') {
      put(3, 2, look.hair);
      put(3, 3, look.hair);
    } else {
      row(0, 7, 8, look.hair);
    }
  }
  if (look.cap) {
    row(1, 5, 10, look.cap);
    row(2, 4, 11, look.cap);
    if (dir === 'down') row(3, 4, 11, look.cap);
    if (dir === 'side') row(3, 8, 12, look.cap);
  }
  if (look.headband) row(3, 4, dir === 'side' ? 10 : 11, look.headband);

  // Body
  const armSwing = frame === 0 ? 0 : frame === 1 ? -1 : 1;
  if (dir === 'side') {
    row(8, 5, 10, look.top);
    for (let y = 9; y <= 11; y++) row(y, 5, 10, look.top);
    if (look.pack) for (let y = 8; y <= 12; y++) row(y, 3, 4, y === 8 ? look.packLight ?? look.pack : look.pack);
    // Arm, swinging with the step
    for (let y = 9; y <= 11; y++) put(7 + armSwing, y, look.topShadow);
    put(7 + armSwing, 12, look.skin);
    if (look.holding === 'laptop') {
      row(10, 9, 11, '5');
      row(11, 9, 11, '4');
    }
  } else {
    row(8, 4, 11, look.top);
    if (dir === 'down') row(8, 6, 9, look.topLight);
    for (let y = 9; y <= 10; y++) row(y, 3, 12, look.top);
    row(11, 4, 11, look.top);
    put(3, 11 + (dir === 'down' ? armSwing : 0) * 0, look.skin);
    put(12, 11, look.skin);
    if (dir === 'down') {
      put(6, 9, look.topLight);
      put(9, 9, look.topLight);
      put(6, 10, look.topLight);
      put(9, 10, look.topLight);
      put(3, 9, look.topShadow);
      put(12, 9, look.topShadow);
    } else {
      put(3, 9, look.topShadow);
      put(12, 9, look.topShadow);
      row(8, 6, 9, look.topShadow); // hood
      if (look.pack) {
        for (let y = 9; y <= 11; y++) row(y, 5, 10, look.pack);
        row(9, 5, 10, look.packLight ?? look.pack);
        put(7, 10, 'a');
      }
    }
    if (look.belt) row(11, 4, 11, look.belt);
  }

  // Held items (front view)
  if (dir === 'down' && look.holding === 'clipboard') {
    row(9, 11, 13, 'n');
    row(10, 11, 13, 'N');
    row(11, 11, 13, 'n');
    put(12, 8, '6');
  }
  if (dir === 'down' && look.holding === 'coffee') {
    row(10, 12, 13, '8');
    row(11, 12, 13, '8');
    put(12, 10, 'w');
  }

  // Legs
  const legs = (y0: number) => {
    if (dir === 'side') {
      row(12, 6, 9, look.pants);
      if (frame === 0) {
        row(13, 7, 8, look.pants);
        row(14, 7, 9, look.shoes);
      } else {
        const fwd = frame === 1 ? 1 : -1;
        row(13, 7 + fwd, 8 + fwd, look.pants);
        row(14, 8 + fwd, 9 + fwd, look.shoes);
        row(13, 7 - fwd, 8 - fwd, look.pants);
        row(14, 6 - fwd, 7 - fwd, look.shoes);
      }
      return;
    }
    row(y0, 5, 10, look.pants);
    const left = frame === 2 ? 'lift' : 'plant';
    const right = frame === 1 ? 'lift' : 'plant';
    for (const [side, x0] of [[left, 5], [right, 9]] as const) {
      if (side === 'plant') {
        row(y0 + 1, x0, x0 + 1, look.pants);
        row(y0 + 2, x0, x0 + 1, look.shoes);
      } else {
        row(y0 + 1, x0, x0 + 1, look.shoes);
      }
    }
  };
  legs(12);

  // Paint, then outline every transparent pixel that touches the silhouette.
  const bmp = new Bitmap(T, T);
  for (const [k, c] of Object.entries(px)) {
    const [x, y] = k.split(',').map(Number);
    bmp.set(x, y, PALETTE[c]);
  }
  const outline: [number, number][] = [];
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      if (px[`${x},${y}`]) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => px[`${x + dx},${y + dy}`])) outline.push([x, y]);
    }
  for (const [x, y] of outline) bmp.set(x, y, PALETTE['0']);
  return bmp;
}

const SHASHI: Look = {
  skin: 'k',
  skinShadow: 'K',
  hair: 'h',
  top: 'A',
  topLight: 'a',
  topShadow: 'z',
  pants: 'B',
  shoes: '8',
  pack: '4',
  packLight: '5',
  holding: 'laptop',
};

const NPC_LOOKS: Record<(typeof NPC_SPRITES)[number], Look | null> = {
  recruiter: {
    skin: 'k',
    skinShadow: 'K',
    hair: 'H',
    hairStyle: 'bun',
    top: 'P',
    topLight: '8',
    topShadow: 'P',
    pants: '2',
    shoes: 'R',
    holding: 'clipboard',
  },
  keeper: {
    skin: 'k',
    skinShadow: 'K',
    hair: '7',
    headband: 'r',
    top: '8',
    topLight: '7',
    topShadow: '7',
    pants: '8',
    shoes: '5',
    belt: '0',
  },
  founder: {
    skin: 'k',
    skinShadow: 'K',
    hair: 'h',
    cap: 'o',
    top: '5',
    topLight: '6',
    topShadow: '4',
    pants: '2',
    shoes: '8',
    holding: 'coffee',
  },
  labBot: null,
};

const labBot = (frame: 0 | 1) =>
  sprite([
    '.......' + (frame ? 'A' : 'a') + '........',
    '......000.......',
    '.......6........',
    '....00000000....',
    '...0677777760...',
    '...069c99c960...',
    '...0699999960...',
    '...0666666660...',
    '....00000000....',
    '..006777777600..',
    '..066a7777a660..',
    '..06677777766 0.',
    '..006666666600..',
    '....0550550.....',
    '....0440440.....',
    '....0000000.....',
  ].map((r) => r.replace(' ', '').padEnd(16, '.').slice(0, 16)));

/* ───────────────────────── UI ───────────────────────── */

const ui = [
  sprite([
    '................',
    '................',
    '...0000000000...',
    '...0888888880...',
    '...0880000880...',
    '...0880888880...',
    '...0880008880...',
    '...0880888880...',
    '...0880000880...',
    '...0888888880...',
    '...0666666660...',
    '...0000000000...',
    '................',
    '................',
    '................',
    '................',
  ]),
  sprite([
    '......0000......',
    '......0yy0......',
    '......0yy0......',
    '......0yy0......',
    '......0yy0......',
    '......0YY0......',
    '......0000......',
    '......0yy0......',
    '......0000......',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ]),
  sprite([
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '....~~~~~~~~....',
    '...~~~~~~~~~~...',
    '....~~~~~~~~....',
    '................',
  ]),
  sprite([
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.......8........',
    '......888.......',
    '.......8........',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ]),
];

/* ───────────────────────── Sheets ───────────────────────── */

function sheet(frames: Record<number, Bitmap> | Bitmap[], columns: number) {
  const entries = Array.isArray(frames) ? frames.map((b, i) => [i, b] as const) : Object.entries(frames).map(([k, b]) => [Number(k), b] as const);
  const count = Math.max(...entries.map(([i]) => i)) + 1;
  const rows = Math.ceil(count / columns);
  const out = new Bitmap(columns * T, rows * T);
  for (const [i, b] of entries) out.blit(b, (i % columns) * T, Math.floor(i / columns) * T);
  return out;
}

const write = (rel: string, bmp: Bitmap) => {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, bmp.png());
  console.log(`  ${path.relative(ROOT, file)}  ${bmp.width}×${bmp.height}  ${(fs.statSync(file).size / 1024).toFixed(1)} KB`);
};

const tileset = sheet({ ...floors, ...walls, ...objects }, TILESET_COLUMNS);
const player = sheet(
  [
    character(SHASHI, 'down', 0),
    character(SHASHI, 'down', 1),
    character(SHASHI, 'down', 2),
    character(SHASHI, 'up', 0),
    character(SHASHI, 'up', 1),
    character(SHASHI, 'up', 2),
    character(SHASHI, 'side', 0),
    character(SHASHI, 'side', 1),
    character(SHASHI, 'side', 2),
  ],
  9
);
const npcs = sheet(
  NPC_SPRITES.flatMap((name) => {
    const look = NPC_LOOKS[name];
    if (!look) return [labBot(0), labBot(1)];
    // Second idle frame: a blink.
    const blink = character({ ...look }, 'down', 0);
    blink.set(6, 5, PALETTE[look.skinShadow]);
    blink.set(9, 5, PALETTE[look.skinShadow]);
    return [character(look, 'down', 0), blink];
  }),
  NPC_SPRITES.length * 2
);
const uiSheet = sheet(ui, ui.length);

console.log('SHASHI.EXE assets →');
write('tilesets/world.png', tileset);
write('characters/shashi.png', player);
write('npcs/npcs.png', npcs);
write('ui/ui.png', uiSheet);

// Full-map render: README screenshot and a sanity check of the layout.
const world = buildWorld();
const map = new Bitmap(world.cols * T, world.rows * T);
const fromSheet = (index: number) => {
  const b = new Bitmap(T, T);
  const sx = (index % TILESET_COLUMNS) * T;
  const sy = Math.floor(index / TILESET_COLUMNS) * T;
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) b.set(x, y, tileset.get(sx + x, sy + y));
  return b;
};
for (let y = 0; y < world.rows; y++)
  for (let x = 0; x < world.cols; x++) {
    for (const layer of [world.ground, world.walls, world.objects]) {
      if (layer[y][x] >= 0) map.blit(fromSheet(layer[y][x]), x * T, y * T);
    }
  }
const npcFrameBitmap = (frame: number) => {
  const b = new Bitmap(T, T);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) b.set(x, y, npcs.get(frame * T + x, y));
  return b;
};
for (const n of NPCS) map.blit(npcFrameBitmap(npcFrame(n.sprite, 0)), n.x * T, n.y * T);
const playerFrame = new Bitmap(T, T);
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) playerFrame.set(x, y, player.get(x, y));
map.blit(playerFrame, SPAWN.x * T, SPAWN.y * T);

const docs = path.join(ROOT, 'docs', 'game');
fs.mkdirSync(docs, { recursive: true });
fs.writeFileSync(path.join(docs, 'world-map.png'), map.png());
console.log(`  docs/game/world-map.png  ${map.width}×${map.height}`);

if (process.argv.includes('--preview')) {
  const dir = path.join(ROOT, '.game-preview');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'tileset.png'), tileset.scaled(4).png());
  fs.writeFileSync(path.join(dir, 'characters.png'), sheet([...Array.from({ length: 9 }, (_, i) => {
    const b = new Bitmap(T, T);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) b.set(x, y, player.get(i * T + x, y));
    return b;
  }), ...Array.from({ length: NPC_SPRITES.length * 2 }, (_, i) => npcFrameBitmap(i))], 9).scaled(6).png());
  fs.writeFileSync(path.join(dir, 'map.png'), map.png());
  console.log(`  previews in ${path.relative(ROOT, dir)}/`);
}
