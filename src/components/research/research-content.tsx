import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { patent, researchInterests as interests } from '@/lib/content';

const { results, hardware, futureScope } = patent;

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-line py-10 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-10">
      <h3 className="flex items-baseline gap-3 text-[15px] font-medium text-fg">
        <span className="label-mono text-fg-faint">{n}</span>
        {title}
      </h3>
      <div className="max-w-[64ch] leading-relaxed text-fg-muted">{children}</div>
    </section>
  );
}

export function ResearchContent() {
  return (
    <div className="container-page">
      <article className="crosshairs border border-line">
        <header className="border-b border-line bg-blueprint p-6 sm:p-10">
          <p className="label-mono flex items-center gap-2 text-signal-ink">
            <span className="size-1.5 bg-signal" />
            {patent.status}
          </p>
          <h2 className="mt-6 max-w-4xl text-[clamp(1.6rem,3.4vw,2.6rem)] leading-[1.1] font-medium tracking-[-0.03em] text-fg text-balance">
            {patent.title}
          </h2>
          <dl className="mt-8 grid gap-px bg-line sm:grid-cols-3">
            {[
              ['Application no.', patent.applicationNo],
              ['Institution', patent.institution],
              ['Period', patent.period],
            ].map(([k, v]) => (
              <div key={k} className="bg-bg px-4 py-3">
                <dt className="label-mono text-fg-faint">{k}</dt>
                <dd className="mt-1 font-mono text-sm text-fg">{v}</dd>
              </div>
            ))}
          </dl>
        </header>

        <div className="px-6 sm:px-10">
          <Section n="01" title="Research problem">
            <p>{patent.problem}</p>
          </Section>

          <Section n="02" title="Methodology">
            <p>{patent.methodology}</p>
          </Section>

          <section className="border-t border-line py-10">
            <h3 className="flex items-baseline gap-3 text-[15px] font-medium text-fg">
              <span className="label-mono text-fg-faint">03</span>
              Key results
            </h3>
            <dl className="mt-8 grid grid-cols-2 gap-px bg-line lg:grid-cols-4">
              {results.map((r) => (
                <div key={r.label} className="flex flex-col-reverse bg-bg py-6 pr-4 sm:pr-6 [&:nth-child(even)]:pl-4 sm:[&:nth-child(even)]:pl-6 lg:[&:not(:first-child)]:pl-6">
                  <dt className="label-mono mt-3 text-fg-faint">{r.label}</dt>
                  <dd className="font-mono text-[clamp(2rem,4vw,3rem)] leading-none tracking-[-0.04em] text-fg tabular-nums">
                    {r.value}
                    {r.unit && <span className="ml-1 text-[0.45em] text-fg-faint">{r.unit}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <Section n="04" title="Technical innovation">
            <p>{patent.innovation}</p>
          </Section>

          <Section n="05" title="Hardware integration">
            <p>{patent.hardwareIntegration}</p>
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {hardware.map((t) => (
                <li key={t} className="rounded-[3px] border border-line px-2 py-1 font-mono text-[11.5px]">
                  {t}
                </li>
              ))}
            </ul>
          </Section>

          <Section n="06" title="Future scope">
            <ul className="space-y-2.5">
              {futureScope.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="font-mono text-fg-faint">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </article>

      <section className="mt-24" aria-label="Additional research interests">
        <div className="flex items-baseline justify-between border-t border-line pt-5">
          <h2 className="label-mono text-fg-faint">Additional research interests</h2>
          <Link href="/exploring" className="label-mono inline-flex items-center gap-1 text-fg-muted hover:text-fg">
            Research log <ArrowUpRight className="size-3" />
          </Link>
        </div>
        <ol className="mt-8 grid gap-10 md:grid-cols-3">
          {interests.map((it, i) => (
            <li key={it.title}>
              <span className="label-mono text-fg-faint">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 text-lg font-medium tracking-[-0.01em] text-fg">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{it.description}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
