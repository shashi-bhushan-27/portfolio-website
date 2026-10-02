import * as Phaser from 'phaser';
import {
  COFFEE_BOOST,
  PLAYER_SPEED,
  SCENES,
  TEXTURES,
  TILE,
  VIEW_TILES,
  VOID_COLOR,
  ZOOM,
} from '@/game/config/game-config';
import { UI_FRAME, type ObjectSprite } from '@/game/config/tiles';
import { NPCS, OBJECTS, RECRUITER_INTERVIEW_SPOT, SECRET_WALL, SPAWN, type NpcId } from '@/game/data/world';
import { Npc } from '@/game/entities/npc';
import { createPlayerAnims, Player } from '@/game/entities/player';
import { gameStore, reducedMotion } from '@/game/store/game-store';
import { audio } from '@/game/systems/audio';
import { worldEffects, type WorldEffect } from '@/game/systems/events';
import { findPath, standingSpot, type Point } from '@/game/systems/pathfinding';
import { buildWorld, npcInteractable, tileKey, type BuiltWorld, type Interactable } from '@/game/systems/world-builder';

type MoveKeys = Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'LEFT' | 'DOWN' | 'RIGHT', Phaser.Input.Keyboard.Key>;

/** Keys typed into these belong to the page, not the game. */
const PAGE_CONTROLS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']);

const GLOWS: Partial<Record<ObjectSprite, number>> = {
  terminalLime: 0xc5ee4f,
  terminalCyan: 0x6fe3f2,
  terminalOrange: 0xf0a03c,
  terminalPurple: 0xa98be8,
  bigScreen: 0xc5ee4f,
  lavaLamp: 0xa98be8,
  oldTerminal: 0xc5ee4f,
};

export class WorldScene extends Phaser.Scene {
  private world!: BuiltWorld;
  private player!: Player;
  private playerShadow!: Phaser.GameObjects.Image;
  private npcs = new Map<NpcId, { npc: Npc; shadow: Phaser.GameObjects.Image }>();
  private npcTiles = new Map<string, NpcId>();
  private walls!: Phaser.Tilemaps.TilemapLayer;
  private keys?: MoveKeys;
  private prompt!: Phaser.GameObjects.Image;
  private questMarker!: Phaser.GameObjects.Image;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private reduced = false;
  private lastStep = 0;
  /** performance.now() when the last panel closed; see the keydown handler. */
  private panelClosedAt = 0;
  private cleanup: (() => void)[] = [];

  constructor() {
    super(SCENES.world);
  }

  create() {
    this.reduced = reducedMotion();
    this.world = buildWorld();
    const state = gameStore.getState();
    const { cols, rows } = this.world;

    // ── Map ──
    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: cols, height: rows });
    const tiles = map.addTilesetImage('world', TEXTURES.tiles.key, TILE, TILE, 0, 0)!;
    const ground = map.createBlankLayer('ground', tiles)!.setDepth(0);
    this.walls = map.createBlankLayer('walls', tiles)!.setDepth(1);
    const objects = map.createBlankLayer('objects', tiles)!.setDepth(2);
    ground.putTilesAt(this.world.ground, 0, 0);
    this.walls.putTilesAt(this.world.walls, 0, 0);
    objects.putTilesAt(this.world.objects, 0, 0);
    this.walls.setCollisionByExclusion([-1]);
    objects.setCollisionByExclusion([-1]);
    if (state.progress.secretUnlocked) this.openSecretWall(false);
    this.physics.world.setBounds(0, 0, cols * TILE, rows * TILE);

    for (const o of OBJECTS) {
      const tint = GLOWS[o.sprite];
      if (tint === undefined) continue;
      const glow = this.add
        .image(o.x * TILE + TILE / 2, o.y * TILE + 6, 'glow')
        .setTint(tint)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.3)
        .setDepth(3);
      if (!this.reduced) {
        this.tweens.add({
          targets: glow,
          alpha: 0.12,
          duration: Phaser.Math.Between(1400, 2200),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }

    // ── Characters ──
    createPlayerAnims(this, TEXTURES.player.key);
    this.player = new Player(this, SPAWN.x, SPAWN.y, TEXTURES.player.key);
    this.playerShadow = this.add.image(0, 0, TEXTURES.ui.key, UI_FRAME.shadow).setDepth(4);
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, objects);
    this.applyGolden();

    for (const n of NPCS) {
      const spot = n.id === 'recruiter' && state.progress.introDone ? RECRUITER_INTERVIEW_SPOT : n;
      const npc = new Npc(this, { ...n, x: spot.x, y: spot.y }, TEXTURES.npcs.key, this.reduced);
      const shadow = this.add.image(npc.x, npc.y + 1, TEXTURES.ui.key, UI_FRAME.shadow).setDepth(4);
      this.npcs.set(n.id, { npc, shadow });
      this.npcTiles.set(tileKey(spot.x, spot.y), n.id);
      this.physics.add.collider(this.player, npc);
    }

    const recruiter = this.npcs.get('recruiter')!.npc;
    this.questMarker = this.add
      .image(recruiter.x, recruiter.y - 14, TEXTURES.ui.key, UI_FRAME.quest)
      .setDepth(1001)
      .setVisible(!state.progress.introDone);
    this.prompt = this.add.image(0, 0, TEXTURES.ui.key, UI_FRAME.prompt).setDepth(1000).setVisible(false);

    this.sparks = this.add
      .particles(0, 0, 'px', {
        lifespan: { min: 450, max: 850 },
        speed: { min: 30, max: 90 },
        angle: { min: 200, max: 340 },
        gravityY: 140,
        scale: { start: 1, end: 0 },
        tint: [0xc5ee4f, 0xf6d55c, 0xffffff],
        emitting: false,
      })
      .setDepth(2000);

    // ── Camera ──
    const cam = this.cameras.main;
    cam.setBackgroundColor(VOID_COLOR);
    cam.setBounds(0, 0, cols * TILE, rows * TILE);
    const lerp = this.reduced ? 1 : 0.14;
    cam.startFollow(this.player, true, lerp, lerp);
    this.fitCamera();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.fitCamera, this);
    this.cleanup.push(() => this.scale.off(Phaser.Scale.Events.RESIZE, this.fitCamera, this));
    if (!this.reduced) cam.fadeIn(450, 11, 13, 16);

    // ── Input ──
    const kb = this.input.keyboard;
    if (kb) {
      // No key capture: the page keeps Space, arrows and typing for its own controls.
      this.keys = kb.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT', false) as MoveKeys;
      const onKey = (e: KeyboardEvent) => {
        if (e.repeat || (e.code !== 'KeyE' && e.code !== 'Space')) return;
        // Phaser hands us keys a frame late. A press from before the last panel closed was
        // meant for that panel (e.g. the E that closed a dialogue) — don't reopen it.
        if (e.timeStamp <= this.panelClosedAt) return;
        if (e.target instanceof HTMLElement && PAGE_CONTROLS.has(e.target.tagName)) return;
        if (this.frozen()) return;
        this.interactNearby();
      };
      kb.on('keydown', onKey);
      this.cleanup.push(() => kb.off('keydown', onKey));
    }
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      if (this.frozen() || p.rightButtonDown()) return;
      this.tapTo(Math.floor(p.worldX / TILE), Math.floor(p.worldY / TILE));
    });

    // ── Store & effects ──
    this.cleanup.push(
      gameStore.subscribe((s, prev) => {
        if (s.panel && !prev.panel) this.player.halt();
        if (!s.panel && prev.panel) this.panelClosedAt = performance.now();
        if (s.progress.introDone && !prev.progress.introDone) this.moveRecruiter();
        if (s.golden !== prev.golden) this.applyGolden();
        if (s.settings.reducedMotion !== prev.settings.reducedMotion) this.reduced = reducedMotion();
      }),
      worldEffects.on((e) => this.effect(e))
    );
    const dispose = () => {
      this.cleanup.forEach((fn) => fn());
      this.cleanup = [];
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, dispose);
    this.events.once(Phaser.Scenes.Events.DESTROY, dispose);

    this.trackArea();
  }

  update(time: number) {
    const frozen = this.frozen();
    if (frozen) {
      if (this.player.moving) this.player.halt();
    } else {
      const k = this.keys;
      const dx = k ? Number(k.D.isDown || k.RIGHT.isDown) - Number(k.A.isDown || k.LEFT.isDown) : 0;
      const dy = k ? Number(k.S.isDown || k.DOWN.isDown) - Number(k.W.isDown || k.UP.isDown) : 0;
      if (dx || dy) this.player.drive(dx, dy, this.speed());
      else if (!this.player.stepPath(time) && this.player.moving) this.player.halt();
    }

    if (this.player.moving && time - this.lastStep > 290) {
      this.lastStep = time;
      audio.play('step');
    }

    this.player.setDepth(this.player.y + 8);
    this.playerShadow.setPosition(this.player.x, this.player.y + 1);
    this.trackArea();
    this.trackNearby(time, frozen);
  }

  private frozen() {
    const s = gameStore.getState();
    return !s.entered || s.panel !== null;
  }

  private speed() {
    return PLAYER_SPEED * (Date.now() < gameStore.getState().coffeeUntil ? COFFEE_BOOST : 1);
  }

  private blocked = (x: number, y: number) =>
    x < 0 || y < 0 || x >= this.world.cols || y >= this.world.rows || this.world.blocked[y][x] || this.npcTiles.has(tileKey(x, y));

  private interactableAt(x: number, y: number): Interactable | null {
    const key = tileKey(x, y);
    const npcId = this.npcTiles.get(key);
    if (npcId) {
      const { npc } = this.npcs.get(npcId)!;
      return npcInteractable(npcId, npc.info.name, x, y);
    }
    const it = this.world.interactables.get(key);
    if (!it) return null;
    if (it.action.kind === 'secret-wall' && gameStore.getState().progress.secretUnlocked) return null;
    return it;
  }

  private trackArea() {
    const t = this.player.tile;
    const area = this.world.areaAt[t.y]?.[t.x];
    // Corridors have no area; keep the last room until the next one.
    if (area) gameStore.getState().setArea(area);
  }

  private trackNearby(time: number, frozen: boolean) {
    const t = this.player.tile;
    const front = this.player.facingTile;
    let best = this.interactableAt(front.x, front.y);
    if (!best) {
      let bestDist = 22;
      const feet = this.player.feet;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const it = this.interactableAt(t.x + dx, t.y + dy);
          if (!it) continue;
          const d = Math.hypot(it.x * TILE + TILE / 2 - feet.x, it.y * TILE + TILE / 2 - feet.y);
          if (d < bestDist) {
            bestDist = d;
            best = it;
          }
        }
    }
    gameStore.getState().setNearby(best);
    const bob = this.reduced ? 0 : Math.round(Math.sin(time / 260) * 1.5);
    this.prompt.setVisible(!!best && !frozen);
    if (best) this.prompt.setPosition(best.x * TILE + TILE / 2, best.y * TILE - 6 + bob);
    if (this.questMarker.visible) {
      const r = this.npcs.get('recruiter')!.npc;
      this.questMarker.setPosition(r.x, r.y - 15 + bob);
    }
  }

  private interactNearby() {
    const target = gameStore.getState().nearby;
    if (!target) return;
    this.player.faceTowards(target);
    gameStore.getState().interact(target);
  }

  private tapTo(tx: number, ty: number) {
    const from = this.player.tile;
    const { cols, rows } = this.world;
    const target = this.interactableAt(tx, ty);

    if (target) {
      const reach = () => {
        this.player.faceTowards(target);
        if (!this.frozen()) gameStore.getState().interact(target);
      };
      if (Math.abs(from.x - tx) + Math.abs(from.y - ty) === 1) {
        reach();
        return;
      }
      const spot = standingSpot(this.blocked, target, from);
      const path = spot && findPath(this.blocked, cols, rows, from, spot);
      if (!spot || !path) return;
      this.tapMarker(spot);
      this.player.followPath(path, this.speed(), reach);
      return;
    }

    const path = findPath(this.blocked, cols, rows, from, { x: tx, y: ty });
    if (!path) return;
    this.tapMarker({ x: tx, y: ty });
    this.player.followPath(path, this.speed());
  }

  private tapMarker(p: Point) {
    const m = this.add
      .image(p.x * TILE + TILE / 2, p.y * TILE + TILE / 2, 'px')
      .setScale(3)
      .setTint(0xc5ee4f)
      .setDepth(5);
    if (this.reduced) {
      this.time.delayedCall(350, () => m.destroy());
      return;
    }
    this.tweens.add({ targets: m, alpha: 0, scale: 1, duration: 450, onComplete: () => m.destroy() });
  }

  private moveRecruiter() {
    const entry = this.npcs.get('recruiter');
    if (!entry) return;
    const { npc, shadow } = entry;
    const go = () => {
      this.npcTiles.delete(tileKey(npc.tileX, npc.tileY));
      npc.moveToTile(RECRUITER_INTERVIEW_SPOT.x, RECRUITER_INTERVIEW_SPOT.y);
      this.npcTiles.set(tileKey(npc.tileX, npc.tileY), 'recruiter');
      shadow.setPosition(npc.x, npc.y + 1);
      npc.setAlpha(1);
      shadow.setAlpha(1);
    };
    this.questMarker.setVisible(false);
    if (this.reduced) {
      go();
      return;
    }
    // She leaves for the interview room once you've walked away.
    this.time.delayedCall(1200, () =>
      this.tweens.add({ targets: [npc, shadow], alpha: 0, duration: 400, onComplete: go })
    );
  }

  private openSecretWall(animate: boolean) {
    for (const { x, y } of SECRET_WALL) {
      this.walls.removeTileAt(x, y);
      this.world.blocked[y][x] = false;
      if (animate) this.sparks.explode(10, x * TILE + TILE / 2, y * TILE + TILE / 2);
    }
  }

  private applyGolden() {
    if (gameStore.getState().golden) this.player.setTint(0xf6d55c);
    else this.player.clearTint();
  }

  private effect(e: WorldEffect) {
    switch (e.kind) {
      case 'celebrate':
        if (!this.reduced) this.sparks.explode(24, this.player.x, this.player.y - 4);
        return;
      case 'secret-opened':
        this.openSecretWall(!this.reduced);
        if (!this.reduced) this.cameras.main.shake(220, 0.004);
        return;
      case 'coffee':
        if (!this.reduced) this.sparks.explode(8, this.player.x, this.player.y - 8);
        return;
      case 'konami':
        this.applyGolden();
        if (!this.reduced) this.sparks.explode(40, this.player.x, this.player.y - 4);
        return;
      case 'boss-hit':
        return;
    }
  }

  private fitCamera() {
    const { width, height } = this.scale.gameSize;
    const fit = Math.min(width / (VIEW_TILES.cols * TILE), height / (VIEW_TILES.rows * TILE));
    this.cameras.main.setZoom(Phaser.Math.Clamp(Math.round(fit), ZOOM.min, ZOOM.max));
  }
}
