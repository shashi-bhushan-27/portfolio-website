import { TEXTURES, TILE } from '@/game/config/game-config';
import { NPC_SPRITES, npcFrame, type NpcSprite } from '@/game/config/tiles';
import { cn } from '@/lib/utils';

/** An NPC (or Shashi) drawn from the game's own spritesheets, scaled up crisply. */
export function PixelPortrait({
  who,
  scale = 4,
  className,
}: {
  who: NpcSprite | 'shashi';
  scale?: number;
  className?: string;
}) {
  const size = TILE * scale;
  const sheet = who === 'shashi' ? TEXTURES.player.url : TEXTURES.npcs.url;
  const frames = who === 'shashi' ? 9 : NPC_SPRITES.length * 2;
  const frame = who === 'shashi' ? 0 : npcFrame(who, 0);
  return (
    <span
      aria-hidden
      className={cn('block shrink-0 [image-rendering:pixelated]', className)}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${sheet})`,
        backgroundSize: `${frames * size}px ${size}px`,
        backgroundPosition: `-${frame * size}px 0`,
      }}
    />
  );
}
