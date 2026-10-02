import * as Phaser from 'phaser';
import { PALETTE, SCENES, TEXTURES } from '@/game/config/game-config';

/** Generates the few textures that don't need a network request, then hands off to the loader. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create() {
    const g = this.make.graphics({}, false);
    g.fillStyle(PALETTE.signalDark).fillRect(0, 0, 12, 12);
    g.fillStyle(PALETTE.signal).fillRect(1, 1, 10, 10);
    g.generateTexture(TEXTURES.player, 12, 12);
    g.destroy();

    this.scene.start(SCENES.preload);
  }
}
