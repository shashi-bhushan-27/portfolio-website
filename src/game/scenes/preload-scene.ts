import * as Phaser from 'phaser';
import { SCENES, TEXTURES, TILE } from '@/game/config/game-config';
import { NPC_SPRITES, TILESET_COLUMNS } from '@/game/config/tiles';
import type { GameBridge } from '@/game/engine/types';

/**
 * Loads the world's sprites (a few KB of PNGs) and reports progress to the shell.
 * A file that fails to load is replaced with flat placeholder frames, so the game
 * still runs. Waits here until the shell starts the world.
 */
export class PreloadScene extends Phaser.Scene {
  constructor(private readonly bridge: GameBridge) {
    super(SCENES.preload);
  }

  preload() {
    this.load.on(Phaser.Loader.Events.PROGRESS, (p: number) => this.bridge.onAssetProgress(p));
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`[shashi.exe] asset failed to load: ${file.key} (${file.url}) — using a placeholder`);
    });
    for (const t of Object.values(TEXTURES)) {
      this.load.spritesheet(t.key, t.url, { frameWidth: TILE, frameHeight: TILE });
    }
  }

  create() {
    this.ensure(TEXTURES.tiles.key, TILESET_COLUMNS, 7, (i) => (i < 16 ? '#262b33' : i < 24 ? '#14171c' : '#5a6370'));
    this.ensure(TEXTURES.player.key, 9, 1, () => '#86ad22');
    this.ensure(TEXTURES.npcs.key, NPC_SPRITES.length * 2, 1, () => '#a98be8');
    this.ensure(TEXTURES.ui.key, 4, 1, () => '#eef1f4');
    this.bridge.onAssetProgress(1);
    this.bridge.onReady();
  }

  /** Placeholder sheet with the same frame layout as the real one. */
  private ensure(key: string, cols: number, rows: number, color: (i: number) => string) {
    if (this.textures.exists(key)) return;
    const canvas = this.textures.createCanvas(key, cols * TILE, rows * TILE);
    if (!canvas) return;
    const ctx = canvas.getContext();
    for (let i = 0; i < cols * rows; i++) {
      const x = (i % cols) * TILE;
      const y = Math.floor(i / cols) * TILE;
      ctx.fillStyle = color(i);
      ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      canvas.add(i, 0, x, y, TILE, TILE);
    }
    canvas.refresh();
  }
}
