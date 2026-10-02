import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { buttonStyles } from '@/components/ui/button';
import { ProjectRow } from '@/components/work/project-row';
import { siteConfig } from '@/lib/constants';
import { topics } from '@/lib/content';
import type { ArticleSummary, MilestoneData, ProjectData } from '@/lib/types';
import { formatDate } from '@/lib/utils';

/* ─── Selected work: an index, not a card grid ─── */

export function SelectedWork({ projects }: { projects: ProjectData[] }) {
  const years = projects.map((p) => p.year).join(' ');
  const span = years.match(/\d{4}/g)?.sort() ?? [];

  return (
    <section id="work" className="container-page mt-28 scroll-mt-20 sm:mt-36" aria-label="Selected work">
      <SectionHeader
        index="01"
        title="Selected work"
        meta={span.length ? `${projects.length} projects · ${span[0]}—${span[span.length - 1]}` : undefined}
        href="/work"
        hrefLabel="All work"
      />
      <ol className="mt-8 border-t border-line">
        {projects.map((p, i) => (
          <ProjectRow key={p.slug} project={p} n={i + 1} />
        ))}
      </ol>
    </section>
  );
}

/* ─── Latest writing ─── */

export function LatestWriting({ articles }: { articles: ArticleSummary[] }) {
  if (!articles.length) return null;
  return (
    <section id="writing" className="container-page mt-28 scroll-mt-20 sm:mt-36" aria-label="Latest writing">
      <SectionHeader
        index="02"
        title="Latest writing"
        meta="Notes & deep-dives"
        href="/insights"
        hrefLabel="All articles"
      />
      <ul className="mt-8 grid gap-px bg-line md:grid-cols-2">
        {articles.map((a) => (
          <li key={a.slug} className="bg-bg">
            <Link
              href={`/insights/${a.slug}`}
              className="group flex h-full flex-col p-6 transition-colors hover:bg-surface sm:p-7"
            >
              <p className="label-mono flex gap-3 text-fg-faint">
                <time dateTime={a.publishedAt}>{formatDate(a.publishedAt, 'iso')}</time>
                <span>{a.category}</span>
              </p>
              <h3 className="mt-5 text-lg leading-snug font-medium tracking-[-0.015em] text-fg text-balance group-hover:text-signal-ink">
                {a.title}
              </h3>
              <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-fg-muted">
                {a.excerpt}
              </p>
              <p className="label-mono mt-auto flex items-center justify-between pt-6 text-fg-faint">
                {a.readingTime} min read
                <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ─── Now: who, and what's on the bench ─── */

export function Now() {
  const active = topics.filter((t) => t.status === 'Active');
  return (
    <section id="now" className="container-page mt-28 scroll-mt-20 sm:mt-36" aria-label="About">
      <SectionHeader index="03" title="Now" href="/about" hrefLabel="About" />
      <div className="mt-10 grid gap-10 md:grid-cols-12">
        <figure className="crosshairs md:col-span-4 lg:col-span-3">
          <div className="relative aspect-[4/5] overflow-hidden bg-surface">
            <Image
              src={siteConfig.portrait}
              alt={siteConfig.name}
              fill
              sizes="(min-width: 1024px) 300px, (min-width: 768px) 33vw, 100vw"
              className="object-cover grayscale transition-[filter] duration-700 hover:grayscale-0"
            />
          </div>
          <figcaption className="label-mono mt-3 flex justify-between text-fg-faint">
            <span>{siteConfig.shortName}</span>
            <span>{siteConfig.location}</span>
          </figcaption>
        </figure>

        <div className="md:col-span-8 lg:col-span-5">
          <p className="text-xl leading-relaxed tracking-[-0.01em] text-fg text-pretty sm:text-[22px]">
            I build intelligent systems end-to-end — from ESP32 beacons and edge gateways to
            ML ensembles, RAG pipelines, and the product surface on top.
          </p>
          <p className="mt-5 leading-relaxed text-fg-muted">
            I have a published patent in signal processing for indoor positioning and have shipped
            platforms across fintech, IoT, and developer tools. I care about understanding the
            problem before writing code, and about systems that hold up in production.
          </p>
        </div>

        <div className="md:col-span-12 lg:col-span-4">
          <p className="label-mono text-fg-faint">On the bench</p>
          <ul className="mt-4 border-t border-line">
            {active.map((t) => (
              <li key={t.title} className="flex items-baseline gap-3 border-b border-line py-3">
                <span className="size-1.5 shrink-0 translate-y-[-2px] bg-signal" />
                <span className="text-sm text-fg">{t.title}</span>
              </li>
            ))}
          </ul>
          <Link href="/exploring" className="label-mono mt-4 inline-block text-fg-muted link-underline hover:text-fg">
            Full research log
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Changelog of milestones ─── */

export function Changelog({ milestones }: { milestones: MilestoneData[] }) {
  if (!milestones.length) return null;
  return (
    <section id="changelog" className="container-page mt-28 scroll-mt-20 sm:mt-36" aria-label="Milestones">
      <SectionHeader index="04" title="Changelog" meta="Engineering milestones" />
      <ol className="relative mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <span aria-hidden className="absolute top-[7px] right-0 left-0 hidden h-px bg-line lg:block" />
        {milestones.map((m, i) => (
          <li key={m.id} className="relative">
            <div className="flex items-center gap-3">
              <span
                className={`relative size-[15px] border ${i === milestones.length - 1 ? 'border-signal-ink bg-signal' : 'border-border bg-bg'}`}
              />
              <span className="label-mono text-fg">v{m.year}</span>
            </div>
            <h3 className="mt-5 font-medium leading-snug tracking-[-0.01em] text-fg">{m.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{m.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ─── Contact ─── */

export function ContactBlock() {
  return (
    <section id="contact" className="container-page mt-28 scroll-mt-20 sm:mt-40" aria-label="Contact">
      <div className="crosshairs border border-line bg-blueprint px-6 py-14 sm:px-12 sm:py-20">
        <p className="label-mono text-fg-faint">[05] Contact</p>
        <h2 className="mt-6 max-w-3xl text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.02] font-medium tracking-[-0.04em] text-fg text-balance">
          Working on something that has to understand, locate, or scale?
        </h2>
        <p className="mt-6 max-w-lg text-fg-muted">
          I&apos;m available for consulting, collaborations, and full-time opportunities.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link href="/contact" className={buttonStyles({ variant: 'primary', size: 'lg' })}>
            Start a conversation
          </Link>
          <a
            href={siteConfig.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ variant: 'secondary', size: 'lg' })}
          >
            LinkedIn
            <ArrowUpRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
