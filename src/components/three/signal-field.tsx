'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTheme } from 'next-themes';
import { SignalScene, type Palette, type Telemetry } from '@/components/three/signal-scene';
import { cn } from '@/lib/utils';
import { useMediaQuery, usePrefersReducedMotion } from '@/lib/hooks';

const PALETTES: Record<'dark' | 'light', Palette> = {
  dark: { dark: true, fg: '#e6e9ee', signal: '#c8f25a', bg: '#0d0f12' },
  light: { dark: false, fg: '#1d222b', signal: '#5f8f12', bg: '#f7f6f2' },
};

function Hud({ telemetry }: { telemetry: Telemetry }) {
  const xRef = useRef<HTMLSpanElement>(null);
  const zRef = useRef<HTMLSpanElement>(null);
  const bRef = useRef<HTMLSpanElement>(null);
  const hRef = useRef<HTMLSpanElement>(null);

  // Written straight to the DOM a few times a second — no React re-renders per frame.
  useEffect(() => {
    const id = setInterval(() => {
      if (xRef.current) xRef.current.textContent = telemetry.x.toFixed(2);
      if (zRef.current) zRef.current.textContent = telemetry.z.toFixed(2);
      if (bRef.current) bRef.current.textContent = String(telemetry.beacons);
      if (hRef.current) hRef.current.textContent = String(Math.round(telemetry.heading)).padStart(3, '0');
    }, 120);
    return () => clearInterval(id);
  }, [telemetry]);

  return (
    <div className="pointer-events-none absolute right-4 bottom-4 w-[12.5rem] border border-line sm:w-[15.5rem] bg-bg/70 font-mono text-[11px] leading-5 text-fg-muted backdrop-blur-sm sm:right-6 lg:right-8 lg:bottom-36">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
        <span className="flex items-center gap-2 uppercase tracking-[0.08em] text-fg">
          <span className="size-1.5 animate-pulse bg-signal" />
          Tracking
        </span>
        <span className="text-fg-faint">ble · rssi</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 px-3 py-2 tabular-nums">
        <dt className="text-fg-faint">pos.x</dt>
        <dd className="text-right text-fg"><span ref={xRef}>--</span> m</dd>
        <dt className="text-fg-faint">pos.y</dt>
        <dd className="text-right text-fg"><span ref={zRef}>--</span> m</dd>
        <dt className="text-fg-faint max-sm:hidden">heading</dt>
        <dd className="text-right text-fg max-sm:hidden"><span ref={hRef}>---</span>°</dd>
        <dt className="text-fg-faint max-sm:hidden">beacons</dt>
        <dd className="text-right text-fg max-sm:hidden"><span ref={bRef}>-</span>/6 heard</dd>
        <dt className="text-fg-faint">σ</dt>
        <dd className="text-right text-signal-ink">±1.6 m</dd>
      </dl>
    </div>
  );
}

export default function SignalField({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const palette = PALETTES[resolvedTheme === 'light' ? 'light' : 'dark'];
  const reduced = usePrefersReducedMotion();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const telemetry = useMemo<Telemetry>(() => ({ x: 0, z: 0, beacons: 0, heading: 0 }), []);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      rootMargin: '80px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Track the pointer across the whole window; the hero text sits over the canvas.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <div ref={host} className={cn('relative', className)}>
      <Canvas
        className={cn(
          '!absolute inset-0 transition-opacity duration-700 ease-out',
          ready ? 'opacity-100' : 'opacity-0'
        )}
        onCreated={() => requestAnimationFrame(() => setReady(true))}
        dpr={[1, 1.75]}
        camera={{ fov: 34, near: 0.1, far: 120, position: [0, 17, 15.5] }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        frameloop={!visible ? 'never' : reduced ? 'demand' : 'always'}
        fallback={<div className="absolute inset-0 bg-blueprint opacity-60" />}
        aria-hidden
      >
        <SignalScene
          palette={palette}
          telemetry={telemetry}
          pointer={pointer}
          animate={!reduced}
          shift={desktop ? 0.1 : 0}
        />
      </Canvas>
      <Hud telemetry={telemetry} />
    </div>
  );
}
