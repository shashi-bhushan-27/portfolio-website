'use client';

import { useEffect, useState } from 'react';
import { siteConfig } from '@/lib/constants';

const formatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: siteConfig.timezone,
});

/** Live wall-clock time in Haridwar. Renders a placeholder until mounted to avoid hydration drift. */
export function LocalTime({ className }: { className?: string }) {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setNow(formatter.format(new Date()));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <time className={className} suppressHydrationWarning>
      {now ?? '--:--'} IST
    </time>
  );
}
