import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const results = [
  { value: '~1.6', unit: 'm', label: 'Mean localization accuracy' },
  { value: '0.978', unit: '', label: 'R² score' },
  { value: '<100', unit: 'ms', label: 'Inference latency' },
  { value: '50+', unit: '', label: 'Concurrent devices' },
];

const hardware = ['ESP32 BLE', 'Raspberry Pi', 'MQTT', 'Edge Computing', 'FastAPI'];

const futureScope = [
  'UWB (Ultra-Wideband) integration for sub-meter accuracy',
  'Federated learning across building deployments',
  'AR navigation overlay for real-time wayfinding',
  'Cloud-edge hybrid architecture for dynamic model updates',
];

const interests = [
  {
    title: 'RAG systems & NLP',
    description:
      'Retrieval-augmented generation pipelines, semantic search architectures, and context-grounded language model inference for domain-specific applications.',
  },
  {
    title: 'Quantitative finance modeling',
    description:
      'Options pricing with ensemble models (Black-Scholes, Heston), volatility forecasting with GARCH, and algorithmic trading signal generation.',
  },
  {
    title: 'Ensemble learning methods',
    description:
      'Dynamic stacking, model selection strategies, and meta-learning approaches for improving prediction robustness across heterogeneous data distributions.',
  },
];

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
            Patent filed
          </p>
          <h2 className="mt-6 max-w-4xl text-[clamp(1.6rem,3.4vw,2.6rem)] leading-[1.1] font-medium tracking-[-0.03em] text-fg text-balance">
            A system and method for coordinated indoor position determination using
            multi-stage signal processing
          </h2>
          <dl className="mt-8 grid gap-px bg-line sm:grid-cols-3">
            {[
              ['Application no.', '202541115892'],
              ['Institution', 'VIT, Vellore, India'],
              ['Period', 'Dec 2024 – Dec 2025'],
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
            <p>
              GPS signals fail in indoor environments due to severe attenuation by walls,
              ceilings, and structural materials. Existing indoor positioning solutions suffer
              from high infrastructure costs, poor accuracy beyond 3–5 meters, and lack of
              adaptability when deployed in new building layouts. There is no generalizable,
              cost-effective system that achieves sub-2-meter accuracy across diverse indoor
              environments.
            </p>
          </Section>

          <Section n="02" title="Methodology">
            <p>
              A multi-stage signal processing pipeline using RSSI and BLE signals from ESP32
              beacons, processed through a FastAPI + MQTT backend, with a dynamic stacking ML
              ensemble for position estimation. Raw signal data is collected at edge gateways
              (Raspberry Pi), filtered and feature-engineered, then fed into a meta-learner that
              combines multiple base estimators to produce a final position prediction.
            </p>
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
            <p>
              A dynamic stacking ensemble built with Scikit-learn and XGBoost that adapts to
              different environments without requiring full retraining. The meta-learner
              automatically selects and weights base models based on local signal
              characteristics. Complemented by an A* graph-based navigation system that
              generates optimal paths in previously unseen building layouts using only
              positioning data and a floor plan graph.
            </p>
          </Section>

          <Section n="05" title="Hardware integration">
            <p>
              ESP32 BLE beacons broadcast calibrated advertising packets at configurable
              intervals. Raspberry Pi edge gateways aggregate and pre-process signals before
              publishing to an MQTT broker, enabling lightweight, low-latency message delivery.
              The edge computing architecture keeps inference close to the data source,
              minimizing round-trip latency and enabling real-time position updates even in
              network-constrained environments.
            </p>
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
