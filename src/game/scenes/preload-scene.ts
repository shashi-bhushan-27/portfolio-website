import * as Phaser from 'phaser';
import { SCENES } from '@/game/config/game-config';
import type { GameBridge } from '@/game/engine/types';

/**
 * Loads world assets and reports progress to the shell. Waits here once done —
 * the shell starts the world when the player presses Enter.
 */
export class PreloadScene extends Phaser.Scene {
  constructor(private readonly bridge: GameBridge) {
    super(SCENES.preload);
  }

  preload() {
    this.load.on(Phaser.Loader.Events.PROGRESS, (p: number) => this.bridge.onAssetProgress(p));
    // A missing asset shouldn't take the game down; the scene that uses it falls back.
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`[shashi.exe] asset failed to load: ${file.key} (${file.url})`);
    });
    // World assets are queued here (under /game/); an empty queue completes immediately.
  }

  create() {
    this.bridge.onAssetProgress(1);
    this.bridge.onReady();
  }
}
