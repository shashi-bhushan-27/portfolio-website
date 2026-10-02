import * as Phaser from 'phaser';
import { SCENES } from '@/game/config/game-config';
import { BootScene } from '@/game/scenes/boot-scene';
import { PreloadScene } from '@/game/scenes/preload-scene';
import { WorldScene } from '@/game/scenes/world-scene';
import type { GameBridge, GameHandle } from '@/game/engine/types';

/**
 * The engine's single entry point. The shell reaches it through a dynamic import,
 * so Phaser and every scene sit in a chunk that only downloads on /play.
 */
export function createGame(parent: HTMLElement, bridge: GameBridge): GameHandle {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    transparent: true,
    pixelArt: true,
    banner: false,
    // Sound comes later through Howler; don't let Phaser open an AudioContext.
    audio: { noAudio: true },
    scale: { mode: Phaser.Scale.RESIZE },
    scene: [new BootScene(), new PreloadScene(bridge), new WorldScene()],
    callbacks: {
      postBoot: (g) => bridge.onRendererReady(g.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas'),
    },
  });

  return {
    enterWorld: () => {
      game.scene.stop(SCENES.preload);
      game.scene.start(SCENES.world);
    },
    destroy: () => game.destroy(true),
  };
}
