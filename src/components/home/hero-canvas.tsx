'use client';

import dynamic from 'next/dynamic';

// three.js is client-only and heavy; keep it out of the server render and the initial bundle.
const load = () => import('@/components/three/signal-field');
// Start fetching the chunk as soon as this module runs on the client, not after hydration.
if (typeof window !== 'undefined') void load();

const SignalField = dynamic(load, {
  ssr: false,
  loading: () => null,
});

export function HeroCanvas({ className }: { className?: string }) {
  return <SignalField className={className} />;
}
