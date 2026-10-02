import * as Phaser from 'phaser';
import { PALETTE, PLAYER_SPEED, SCENES, TEXTURES, TILE, WORLD } from '@/game/config/game-config';

type MoveKeys = Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'LEFT' | 'DOWN' | 'RIGHT', Phaser.Input.Keyboard.Key>;

const WIDTH = WORLD.cols * TILE;
const HEIGHT = WORLD.rows * TILE;

/**
 * Placeholder world: an empty floor and a player you can move with the keyboard
 * or by tapping. Proves input, scaling and the camera before the real map exists.
 */
export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image;
  private keys?: MoveKeys;
  private target: Phaser.Math.Vector2 | null = null;

  constructor() {
    super(SCENES.world);
  }

  create() {
    // Same engineering-paper grid as the portfolio, one cell per tile.
    this.add.grid(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, TILE, TILE, PALETTE.floor, 1, PALETTE.gridLine, 0.06);
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT).setStrokeStyle(1, PALETTE.edge);

    this.player = this.add.image(WIDTH / 2, HEIGHT / 2, TEXTURES.player);

    this.keys = this.input.keyboard?.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT') as MoveKeys | undefined;
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      this.target = new Phaser.Math.Vector2(p.worldX, p.worldY);
    });

    this.fitCamera();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.fitCamera, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.fitCamera, this);
    });
  }

  update(_time: number, delta: number) {
    const k = this.keys;
    let dx = 0;
    let dy = 0;
    if (k) {
      dx = Number(k.D.isDown || k.RIGHT.isDown) - Number(k.A.isDown || k.LEFT.isDown);
      dy = Number(k.S.isDown || k.DOWN.isDown) - Number(k.W.isDown || k.UP.isDown);
    }

    const step = (PLAYER_SPEED * delta) / 1000;
    if (dx || dy) {
      this.target = null;
      const v = new Phaser.Math.Vector2(dx, dy).normalize().scale(step);
      this.moveTo(this.player.x + v.x, this.player.y + v.y);
    } else if (this.target) {
      const to = this.target.clone().subtract(this.player);
      if (to.length() <= step) {
        this.moveTo(this.target.x, this.target.y);
        this.target = null;
      } else {
        to.normalize().scale(step);
        this.moveTo(this.player.x + to.x, this.player.y + to.y);
      }
    }
  }

  private moveTo(x: number, y: number) {
    const half = this.player.width / 2;
    this.player.setPosition(
      Phaser.Math.Clamp(x, half, WIDTH - half),
      Phaser.Math.Clamp(y, half, HEIGHT - half)
    );
  }

  private fitCamera() {
    const { width, height } = this.scale.gameSize;
    const fit = Math.min(width / (WIDTH + TILE * 2), height / (HEIGHT + TILE * 2));
    // Whole-number zoom keeps pixels crisp; small screens get a fractional fit instead.
    this.cameras.main.setZoom(fit >= 1 ? Math.floor(fit) : fit).centerOn(WIDTH / 2, HEIGHT / 2);
  }
}
