/** Engine constants. Plain values only — no Phaser import — so any layer can read them. */

export const SCENES = {
  boot: 'boot',
  preload: 'preload',
  world: 'world',
} as const;

/** Texture keys, and where each one is loaded from (all under /public/game). */
export const TEXTURES = {
  tiles: { key: 'tiles', url: '/game/tilesets/world.png' },
  player: { key: 'shashi', url: '/game/characters/shashi.png' },
  npcs: { key: 'npcs', url: '/game/npcs/npcs.png' },
  ui: { key: 'ui', url: '/game/ui/ui.png' },
} as const;

/** Tile size in pixels. */
export const TILE = 16;

/** World pixels per second. */
export const PLAYER_SPEED = 78;
export const COFFEE_BOOST = 1.17;

/** Roughly how many tiles the camera should frame; zoom is the whole number closest to that. */
export const VIEW_TILES = { cols: 24, rows: 14 } as const;
export const ZOOM = { min: 2, max: 5 } as const;

/** Background behind the map (the void between rooms). */
export const VOID_COLOR = '#0b0d10';
