import * as Phaser from 'phaser';
import { SCENES } from '@/game/config/game-config';

/** Generates the few textures that don't need a network request, then hands off to the loader. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create() {
    // A soft round glow, for terminals and screens.
    const size = 48;
    const glow = this.textures.createCanvas('glow', size, size);
    if (glow) {
      const ctx = glow.getContext();
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, 'rgba(255,255,255,0.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      glow.refresh();
    }

    // 2×2 pixel for particles and the tap marker.
    const px = this.make.graphics({}, false);
    px.fillStyle(0xffffff).fillRect(0, 0, 2, 2);
    px.generateTexture('px', 2, 2);
    px.destroy();

    this.scene.start(SCENES.preload);
  }
}
