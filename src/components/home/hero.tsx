import Link from 'next/link';
import { ArrowRight, ArrowDownToLine } from 'lucide-react';
import { siteConfig } from '@/lib/constants';
import { buttonStyles } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { HeroCanvas } from '@/components/home/hero-canvas';
import { cn } from '@/lib/utils';

const lines = ['Building systems', 'that understand,', 'locate, and scale.'];

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as React.CSSProperties;

export function Hero() {
  return (
    <section className="relative isolate flex flex-col overflow-hidden border-b border-line lg:min-h-[max(780px,100svh)]">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-blueprint [mask-image:radial-gradient(110%_80%_at_75%_40%,black,transparent_75%)]"
      />

      <div className="container-page relative z-10 pt-28 lg:pt-40">
        <div className="max-w-xl">
          <p className="label-mono fade-in flex items-center gap-2 text-fg-muted">
            <span className="size-1.5 bg-signal" />
            {siteConfig.role} — {siteConfig.location}
          </p>

          <h1 className="mt-7 text-[clamp(2.6rem,5.6vw,5.1rem)] leading-[0.98] font-medium tracking-[-0.05em] text-fg sm:whitespace-nowrap">
            {lines.map((line, i) => (
              <span key={line} className="rise-line" style={{ '--i': i } as React.CSSProperties}>
                <span>{line}</span>
              </span>
            ))}
          </h1>

          <p
            className="fade-in mt-7 max-w-md text-[17px] leading-relaxed text-fg-muted text-pretty"
            style={delay(450)}
          >
            I design and engineer intelligent software — machine learning, distributed
            architectures, indoor localization, and the web platforms that put them in
            front of people.
          </p>

          <div className="fade-in mt-9 flex flex-wrap items-center gap-3" style={delay(600)}>
            <Link href="/work" className={buttonStyles({ variant: 'primary', size: 'lg' })}>
              Selected work
              <ArrowRight className="size-4" />
            </Link>
            <a
              href={siteConfig.resume}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({ variant: 'secondary', size: 'lg' })}
            >
              <ArrowDownToLine className="size-4" />
              Résumé
            </a>
            <CopyButton
              value={siteConfig.links.email}
              label="Copy email"
              copiedLabel="Email copied"
              className="px-3 text-sm"
            />
          </div>
        </div>
      </div>

      <HeroCanvas className="fade-in mt-8 h-[400px] sm:h-[480px] lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:h-auto lg:w-[64%] lg:[mask-image:linear-gradient(to_right,transparent,black_24%)]" />

      <div className="container-page relative z-10 pb-10 lg:mt-auto">
        <dl
          className="fade-in grid grid-cols-2 border-t border-line md:grid-cols-4"
          style={delay(800)}
        >
          {siteConfig.readouts.map((r, i) => (
            <div
              key={r.label}
              className={cn(
                'py-4 pr-4',
                i % 2 === 1 && 'border-l border-line pl-4',
                i >= 2 && 'border-t border-line md:border-t-0',
                i === 2 && 'md:border-l md:pl-4'
              )}
            >
              <dt className="label-mono text-fg-faint">{r.label}</dt>
              <dd className="mt-1.5 font-mono text-lg tracking-tight text-fg tabular-nums">
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
