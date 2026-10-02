/**
 * Frame indices into the generated spritesheets (scripts/build-game-assets.ts draws
 * them in exactly this order). Plain values — shared by the asset script, the
 * world builder and the scenes.
 */

export const TILESET_COLUMNS = 8;

export const FLOOR = {
  hub: 0,
  hubAlt: 1,
  lab: 2,
  labAlt: 3,
  garage: 4,
  garageAlt: 5,
  wood: 6,
  arena: 7,
  arenaAlt: 8,
  startup: 9,
  interview: 10,
  secret: 11,
  secretAlt: 12,
  corridor: 13,
  rug: 14,
} as const;

export const WALL = {
  top: 16,
  brick: 17,
  lab: 18,
  wood: 19,
  garage: 20,
  cracked: 21,
  secret: 22,
  arena: 23,
} as const;

export const OBJECT = {
  terminalLime: 24,
  terminalCyan: 25,
  terminalOrange: 26,
  terminalPurple: 27,
  serverRack: 28,
  desk: 29,
  deskComputer: 30,
  chair: 31,
  plant: 32,
  bookshelf: 33,
  machine: 34,
  machineAlt: 35,
  trophyGold: 36,
  trophySilver: 37,
  plaque: 38,
  coffee: 39,
  duck: 40,
  whiteboard: 41,
  sofa: 42,
  pillar: 43,
  questBoard: 44,
  sign: 45,
  lavaLamp: 46,
  crate: 47,
  pingPong: 48,
  waterCooler: 49,
  certificates: 50,
  bigScreen: 51,
  floorPlan: 52,
  banner: 53,
  learningBoard: 54,
  oldTerminal: 55,
} as const;

export type ObjectSprite = keyof typeof OBJECT;
export type FloorStyle = 'hub' | 'lab' | 'garage' | 'wood' | 'arena' | 'startup' | 'interview' | 'secret' | 'corridor';
export type WallStyle = 'brick' | 'lab' | 'wood' | 'garage' | 'secret' | 'arena';

/** Player sheet: 3 frames per direction (stand, step, step), side frames face right. */
export const PLAYER_FRAMES = { down: [0, 1, 2], up: [3, 4, 5], side: [6, 7, 8] } as const;

/** NPC sheet: two idle frames per character, in this order. */
export const NPC_SPRITES = ['recruiter', 'keeper', 'founder', 'labBot'] as const;
export type NpcSprite = (typeof NPC_SPRITES)[number];
export const npcFrame = (sprite: NpcSprite, frame: 0 | 1) => NPC_SPRITES.indexOf(sprite) * 2 + frame;

/** UI sheet (16×16 frames). */
export const UI_FRAME = { prompt: 0, quest: 1, shadow: 2, spark: 3 } as const;
