import Image from 'next/image';
import { ArrowDownToLine, ArrowUpRight } from 'lucide-react';
import { siteConfig } from '@/lib/constants';
import { education, expertiseAreas, principles, skillGroups } from '@/lib/content';
import { buttonStyles } from '@/components/ui/button';

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-line py-10 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-10">
      <h2 className="label-mono pt-1 text-fg-faint">{label}</h2>
      <div>{children}</div>
    </section>
  );
}

export function AboutContent() {
  return (
    <div className="container-page grid gap-12 lg:grid-cols-12">
      <aside className="lg:col-span-4">
        <div className="lg:sticky lg:top-24">
          <figure className="crosshairs max-w-sm">
            <div className="relative aspect-[4/5] overflow-hidden bg-surface">
              <Image
                src={siteConfig.portrait}
                alt={siteConfig.name}
                fill
                priority
                sizes="(min-width: 1024px) 380px, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="label-mono mt-3 flex justify-between text-fg-faint">
              <span>{siteConfig.name}</span>
              <span>{siteConfig.location}</span>
            </figcaption>
          </figure>
          <div className="mt-8 flex flex-wrap gap-2">
            <a
              href={siteConfig.resume}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({ variant: 'primary' })}
            >
              <ArrowDownToLine className="size-4" />
              Résumé
            </a>
            <a href={siteConfig.links.github} target="_blank" rel="noopener noreferrer" className={buttonStyles()}>
              GitHub <ArrowUpRight className="size-3.5" />
            </a>
            <a href={siteConfig.links.linkedin} target="_blank" rel="noopener noreferrer" className={buttonStyles()}>
              LinkedIn <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>
      </aside>

      <div className="lg:col-span-8">
        <div className="space-y-6 pb-12">
          <p className="text-[clamp(1.25rem,2.2vw,1.6rem)] leading-snug tracking-[-0.015em] text-fg text-pretty">
            I&apos;m Shashi Bhushan Vijay, a software engineer who designs and builds
            intelligent systems — machine learning pipelines, distributed architectures,
            indoor localization, and AI-powered applications.
          </p>
          <p className="max-w-[62ch] leading-relaxed text-fg-muted">
            I hold a patent in signal processing for indoor positioning and have built
            production-grade platforms across fintech, IoT, and developer tools. My approach is
            rooted in understanding the problem deeply before writing code: the best systems
            come from clear thinking about architecture, trade-offs, and the people using them.
          </p>
        </div>

        <Block label="Principles">
          <ol className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {principles.map((p, i) => (
              <li key={p.title}>
                <p className="flex items-baseline gap-3 font-medium text-fg">
                  <span className="font-mono text-[11px] text-fg-faint">{String(i + 1).padStart(2, '0')}</span>
                  {p.title}
                </p>
                <p className="mt-1.5 pl-7 text-sm leading-relaxed text-fg-muted">{p.description}</p>
              </li>
            ))}
          </ol>
        </Block>

        <Block label="Areas">
          <p className="leading-loose text-fg">
            {expertiseAreas.map((a, i) => (
              <span key={a} className="whitespace-nowrap">
                {a}
                {i < expertiseAreas.length - 1 && <span className="mx-2 text-fg-faint">/</span>}
              </span>
            ))}
          </p>
        </Block>

        <Block label="Toolbox">
          <dl className="divide-y divide-line border-y border-line">
            {skillGroups.map((g) => (
              <div key={g.label} className="grid gap-2 py-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
                <dt className="text-sm text-fg">{g.label}</dt>
                <dd className="font-mono text-[12.5px] leading-relaxed text-fg-muted">
                  {g.items.join('  ·  ')}
                </dd>
              </div>
            ))}
          </dl>
        </Block>

        <Block label="Education">
          <p className="font-medium text-fg">{education.school}</p>
          <p className="mt-1 text-fg-muted">{education.degree}</p>
          <p className="label-mono mt-2 text-fg-faint">{education.expected}</p>
        </Block>

        <Block label="North star">
          <blockquote className="border-l-2 border-signal-ink pl-5 text-xl leading-snug tracking-[-0.01em] text-fg">
            Build intelligent systems that solve real-world problems at scale.
          </blockquote>
        </Block>
      </div>
    </div>
  );
}
