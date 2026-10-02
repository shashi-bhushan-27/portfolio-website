import type { Metadata, Viewport } from 'next';
import { GameLoader } from '@/game/game-loader';

export const metadata: Metadata = {
  title: { absolute: 'Shashi.EXE — Interactive Portfolio' },
  description: 'Explore an interactive developer portfolio built by Shashi.',
  alternates: { canonical: '/play' },
};

export const viewport: Viewport = {
  themeColor: '#0d0f12',
};

export default function PlayPage() {
  return <GameLoader />;
}
