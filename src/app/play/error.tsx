'use client';

import { GameError } from '@/game/ui/game-error';
import { GameFrame } from '@/game/ui/game-frame';

// Catches render errors and a game-shell chunk that fails to download.
export default function PlayError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <GameFrame>
      <GameError error={error} onRetry={unstable_retry} />
    </GameFrame>
  );
}
