'use client';

import dynamic from 'next/dynamic';

// three.js is client-only and heavy; keep it out of the server render and the initial bundle.
const SignalField = dynamic(() => import('@/components/three/signal-field'), {
  ssr: false,
  loading: () => null,
});

export function HeroCanvas({ className }: { className?: string }) {
  return <SignalField className={className} />;
}
