'use client';

import { motion } from 'motion/react';
import {
  Shield,
  Award,
  Cpu,
  Wifi,
  MapPin,
  Zap,
  BarChart3,
  Layers,
  Brain,
  TrendingUp,
  FlaskConical,
  ExternalLink,
} from 'lucide-react';

/* ─── Scroll-triggered wrapper ─── */
function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Metric Card ─── */
function MetricCard({
  value,
  label,
  icon: Icon,
  delay,
}: {
  value: string;
  label: string;
  icon: React.ElementType;
  delay: number;
}) {
  return (
    <FadeUp delay={delay}>
      <div className="bg-muted/50 rounded-xl p-6 border border-border/30 group hover:border-primary/30 transition-colors duration-300">
        <Icon className="w-5 h-5 text-primary/70 mb-3" />
        <p className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-1 gradient-text">
          {value}
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </FadeUp>
  );
}

/* ─── Section Block ─── */
function ResearchSection({
  number,
  title,
  children,
  delay = 0,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <FadeUp delay={delay}>
      <div className="group">
        <div className="flex items-start gap-4 mb-3">
          <span className="text-xs font-mono text-primary/60 bg-primary/5 rounded-md px-2 py-1 shrink-0 mt-0.5">
            {number}
          </span>
          <h3 className="text-xl font-display font-semibold tracking-tight">
            {title}
          </h3>
        </div>
        <div className="pl-12 text-muted-foreground leading-relaxed text-[15px]">
          {children}
        </div>
      </div>
    </FadeUp>
  );
}

/* ─── Interest Card ─── */
function InterestCard({
  title,
  description,
  icon: Icon,
  delay,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  delay: number;
}) {
  return (
    <FadeUp delay={delay}>
      <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 hover:border-primary/20 transition-colors duration-300 h-full">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h4 className="text-lg font-display font-semibold mb-2">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </FadeUp>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export function ResearchContent() {
  return (
    <section className="section-padding">
      <div className="container-custom max-w-4xl">
        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20"
        >
          <h1 className="text-5xl font-display font-bold tracking-tight mb-4">
            Research &{' '}
            <span className="gradient-text">Publications</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Exploring the intersection of signal processing, machine learning,
            and embedded systems — from patent filings to production prototypes.
          </p>
        </motion.div>

        {/* ── Featured Patent ── */}
        <FadeUp>
          <div className="bg-card border border-primary/20 rounded-2xl p-8 md:p-12 mb-20 relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
                <Shield className="w-3.5 h-3.5" />
                Patent Filed
              </div>

              {/* Title */}
              <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight mb-6 max-w-3xl leading-tight">
                A System And Method For Coordinated Indoor Position
                Determination Using Multi-Stage Signal Processing
              </h2>

              {/* Meta */}
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground mb-10">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-primary/60" />
                  Application No.{' '}
                  <span className="font-mono text-foreground/80">
                    202541115892
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary/60" />
                  VIT, Vellore, India
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary/60" />
                  December 2024 – December 2025
                </span>
              </div>

              {/* ── Divider ── */}
              <div className="border-t border-border/50 my-10" />

              {/* ── Research sections ── */}
              <div className="space-y-10">
                <ResearchSection number="01" title="Research Problem" delay={0.05}>
                  <p>
                    GPS signals fail in indoor environments due to severe
                    attenuation by walls, ceilings, and structural materials.
                    Existing indoor positioning solutions suffer from high
                    infrastructure costs, poor accuracy beyond 3–5 meters, and
                    lack of adaptability when deployed in new building layouts.
                    There is no generalizable, cost-effective system that
                    achieves sub-2-meter accuracy across diverse indoor
                    environments.
                  </p>
                </ResearchSection>

                <ResearchSection number="02" title="Methodology" delay={0.1}>
                  <p>
                    A multi-stage signal processing pipeline using RSSI and BLE
                    signals from ESP32 beacons, processed through a FastAPI +
                    MQTT backend, with a dynamic stacking ML ensemble for
                    position estimation. Raw signal data is collected at edge
                    gateways (Raspberry Pi), filtered and feature-engineered,
                    then fed into a meta-learner that combines multiple base
                    estimators to produce a final position prediction.
                  </p>
                </ResearchSection>

                {/* ── Key Results ── */}
                <div>
                  <div className="flex items-start gap-4 mb-6">
                    <span className="text-xs font-mono text-primary/60 bg-primary/5 rounded-md px-2 py-1 shrink-0 mt-0.5">
                      03
                    </span>
                    <h3 className="text-xl font-display font-semibold tracking-tight">
                      Key Results
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-12">
                    <MetricCard
                      value="~1.6m"
                      label="Mean Accuracy"
                      icon={MapPin}
                      delay={0.1}
                    />
                    <MetricCard
                      value="0.978"
                      label="R² Score"
                      icon={BarChart3}
                      delay={0.15}
                    />
                    <MetricCard
                      value="<100ms"
                      label="Inference Latency"
                      icon={Zap}
                      delay={0.2}
                    />
                    <MetricCard
                      value="50+"
                      label="Concurrent Devices"
                      icon={Wifi}
                      delay={0.25}
                    />
                  </div>
                </div>

                <ResearchSection
                  number="04"
                  title="Technical Innovation"
                  delay={0.1}
                >
                  <p>
                    A dynamic stacking ensemble built with Scikit-learn and
                    XGBoost that adapts to different environments without
                    requiring full retraining. The meta-learner automatically
                    selects and weights base models based on local signal
                    characteristics. Complemented by an A* graph-based
                    navigation system that generates optimal paths in previously
                    unseen building layouts using only positioning data and a
                    floor plan graph.
                  </p>
                </ResearchSection>

                <ResearchSection
                  number="05"
                  title="Hardware Integration"
                  delay={0.1}
                >
                  <div className="space-y-3">
                    <p>
                      ESP32 BLE beacons broadcast calibrated advertising packets
                      at configurable intervals. Raspberry Pi edge gateways
                      aggregate and pre-process signals before publishing to an
                      MQTT broker, enabling lightweight, low-latency message
                      delivery. The edge computing architecture keeps inference
                      close to the data source, minimizing round-trip latency
                      and enabling real-time position updates even in
                      network-constrained environments.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {[
                        'ESP32 BLE',
                        'Raspberry Pi',
                        'MQTT',
                        'Edge Computing',
                        'FastAPI',
                      ].map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 rounded-md bg-muted/60 text-xs font-mono text-muted-foreground border border-border/30"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </ResearchSection>

                <ResearchSection number="06" title="Future Scope" delay={0.1}>
                  <ul className="space-y-2 list-none">
                    {[
                      'UWB (Ultra-Wideband) integration for sub-meter accuracy',
                      'Federated learning across building deployments',
                      'AR navigation overlay for real-time wayfinding',
                      'Cloud-edge hybrid architecture for dynamic model updates',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-primary/50 mt-1.5 shrink-0">
                          →
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </ResearchSection>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* ── Additional Research Interests ── */}
        <FadeUp>
          <div className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">
              Additional Research Interests
            </h2>
          </div>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-4">
          <InterestCard
            title="RAG Systems & NLP"
            description="Retrieval-augmented generation pipelines, semantic search architectures, and context-grounded language model inference for domain-specific applications."
            icon={Brain}
            delay={0.05}
          />
          <InterestCard
            title="Quantitative Finance Modeling"
            description="Options pricing with ensemble models (Black-Scholes, Heston), volatility forecasting with GARCH, and algorithmic trading signal generation."
            icon={TrendingUp}
            delay={0.1}
          />
          <InterestCard
            title="Ensemble Learning Methods"
            description="Dynamic stacking, model selection strategies, and meta-learning approaches for improving prediction robustness across heterogeneous data distributions."
            icon={FlaskConical}
            delay={0.15}
          />
        </div>
      </div>
    </section>
  );
}
