/** Engine constants. Plain values only — no Phaser import — so any layer can read them. */

export const SCENES = {
  boot: 'boot',
  preload: 'preload',
  world: 'world',
} as const;

export const TEXTURES = {
  player: 'player-placeholder',
} as const;

/** World grid, in tiles. */
export const TILE = 16;
export const WORLD = { cols: 40, rows: 24 } as const;

/** World-units per second. */
export const PLAYER_SPEED = 96;

/** sRGB approximations of the site's dark tokens (globals.css), for drawing on the canvas. */
export const PALETTE = {
  floor: 0x121418,
  gridLine: 0xf3f4f6,
  edge: 0x3a3f47,
  signal: 0xc5ee4f,
  signalDark: 0x5c7a12,
} as const;
