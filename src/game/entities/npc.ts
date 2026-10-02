import * as Phaser from 'phaser';
import { TILE } from '@/game/config/game-config';
import { npcFrame, type NpcSprite } from '@/game/config/tiles';
import type { WorldNpc } from '@/game/data/world';

/** An idle character standing on one tile; immovable, with a slow blink. */
export class Npc extends Phaser.Physics.Arcade.Sprite {
  tileX: number;
  tileY: number;

  constructor(
    scene: Phaser.Scene,
    readonly info: WorldNpc,
    sheet: string,
    reducedMotion: boolean
  ) {
    super(scene, info.x * TILE + TILE / 2, info.y * TILE + TILE / 2 - 4, sheet, npcFrame(info.sprite, 0));
    this.tileX = info.x;
    this.tileY = info.y;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    // Reaches the bottom of the NPC's tile, so the player stops a tile away instead of overlapping.
    body.setSize(14, 12).setOffset(1, 8).setImmovable(true);
    body.moves = false;
    this.setDepth(this.y + 8);

    const key = `npc-idle-${info.sprite}`;
    if (!scene.anims.exists(key)) {
      scene.anims.create({
        key,
        frames: [
          { key: sheet, frame: npcFrame(info.sprite, 0), duration: 2600 },
          { key: sheet, frame: npcFrame(info.sprite, 1), duration: 160 },
        ],
        repeat: -1,
      });
    }
    if (!reducedMotion) this.anims.play({ key, startFrame: 0, delay: Phaser.Math.Between(0, 1800) });
  }

  get sprite(): NpcSprite {
    return this.info.sprite;
  }

  moveToTile(x: number, y: number) {
    this.tileX = x;
    this.tileY = y;
    this.setPosition(x * TILE + TILE / 2, y * TILE + TILE / 2 - 4);
    (this.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
    this.setDepth(this.y + 8);
  }
}
