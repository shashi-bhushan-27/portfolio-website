import * as Phaser from 'phaser';
import { TILE } from '@/game/config/game-config';
import { PLAYER_FRAMES } from '@/game/config/tiles';
import type { Point } from '@/game/systems/pathfinding';

export type Facing = 'down' | 'up' | 'left' | 'right';

const FACING_VECTOR: Record<Facing, Point> = {
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** Registers the walk/idle animations once per game. */
export function createPlayerAnims(scene: Phaser.Scene, key: string) {
  for (const dir of ['down', 'up', 'side'] as const) {
    const [stand, a, b] = PLAYER_FRAMES[dir];
    if (scene.anims.exists(`walk-${dir}`)) continue;
    scene.anims.create({
      key: `walk-${dir}`,
      frames: scene.anims.generateFrameNumbers(key, { frames: [a, stand, b, stand] }),
      frameRate: 9,
      repeat: -1,
    });
  }
}

/**
 * Shashi. Collides with a small box at the feet; position logic uses the body centre,
 * which sits in the middle of the tile the player is standing on.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  facing: Facing = 'down';
  private path: Point[] = [];
  private onArrive: (() => void) | null = null;
  private lastProgressAt = 0;
  private lastDistance = Infinity;
  private pathSpeed = 0;

  constructor(scene: Phaser.Scene, tileX: number, tileY: number, sheet: string) {
    super(scene, tileX * TILE + TILE / 2, tileY * TILE + TILE / 2 - 4, sheet, PLAYER_FRAMES.down[0]);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 7).setOffset(3, 9);
    body.setCollideWorldBounds(true);
  }

  get feet(): Point {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return { x: body.center.x, y: body.center.y };
  }

  get tile(): Point {
    const f = this.feet;
    return { x: Math.floor(f.x / TILE), y: Math.floor(f.y / TILE) };
  }

  get facingTile(): Point {
    const t = this.tile;
    const v = FACING_VECTOR[this.facing];
    return { x: t.x + v.x, y: t.y + v.y };
  }

  /** Keyboard movement; cancels any tap-to-move path. */
  drive(dx: number, dy: number, speed: number) {
    this.path = [];
    this.onArrive = null;
    this.walk(dx, dy, speed);
  }

  followPath(points: Point[], speed: number, onArrive?: () => void) {
    this.path = points.slice(1); // the first point is where we already are
    this.onArrive = onArrive ?? null;
    this.lastDistance = Infinity;
    this.lastProgressAt = this.scene.time.now;
    this.pathSpeed = speed;
    if (!this.path.length) this.arrive();
  }

  get following() {
    return this.path.length > 0;
  }

  /** Advance along the current path. Returns false when idle. */
  stepPath(time: number) {
    if (!this.path.length) return false;
    const target = { x: this.path[0].x * TILE + TILE / 2, y: this.path[0].y * TILE + TILE / 2 };
    const f = this.feet;
    const dx = target.x - f.x;
    const dy = target.y - f.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) {
      this.path.shift();
      this.lastDistance = Infinity;
      if (!this.path.length) {
        this.arrive();
        return false;
      }
      return true;
    }
    // Something (an NPC that moved) is in the way: give up rather than push forever.
    if (dist < this.lastDistance - 0.5) {
      this.lastDistance = dist;
      this.lastProgressAt = time;
    } else if (time - this.lastProgressAt > 600) {
      this.halt();
      return false;
    }
    this.walk(dx, dy, this.pathSpeed);
    return true;
  }

  private arrive() {
    this.halt();
    const done = this.onArrive;
    this.onArrive = null;
    done?.();
  }

  faceTowards(p: Point) {
    const t = this.tile;
    const dx = p.x - t.x;
    const dy = p.y - t.y;
    this.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy < 0 ? 'up' : 'down';
    this.showIdle();
  }

  halt() {
    this.path = [];
    this.setVelocity(0, 0);
    this.showIdle();
  }

  private walk(dx: number, dy: number, speed: number) {
    const v = new Phaser.Math.Vector2(dx, dy).normalize().scale(speed);
    this.setVelocity(v.x, v.y);
    this.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy < 0 ? 'up' : 'down';
    const dir = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
    this.setFlipX(this.facing === 'left');
    this.anims.play(`walk-${dir}`, true);
  }

  private showIdle() {
    this.anims.stop();
    const dir = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
    this.setFlipX(this.facing === 'left');
    this.setFrame(PLAYER_FRAMES[dir][0]);
  }

  get moving() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return body.velocity.lengthSq() > 1;
  }
}
