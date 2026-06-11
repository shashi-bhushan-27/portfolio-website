'use client';

import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import {
  Layers,
  FlaskConical,
  Rocket,
  TrendingUp,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

/* ─── Animation helpers ─── */
function Section({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Data ─── */
const principles = [
  {
    icon: Layers,
    title: 'Systems Thinking',
    description:
      'Understanding how components interact matters more than individual optimizations.',
  },
  {
    icon: FlaskConical,
    title: 'Research-Driven',
    description:
      'Every engineering decision should be informed by data, not assumptions.',
  },
  {
    icon: Rocket,
    title: 'Production Mindset',
    description:
      "Code that doesn't ship doesn't matter. I build for deployment.",
  },
  {
    icon: TrendingUp,
    title: 'Continuous Learning',
    description:
      'Technology evolves rapidly. Staying current is a professional obligation.',
  },
];

const expertiseAreas = [
  'Software Engineering',
  'Full Stack Development',
  'AI/ML',
  'System Design',
  'Distributed Systems',
  'IoT',
  'Blockchain',
  'Cloud Applications',
];

const skillGroups = [
  { label: 'Languages', items: ['C++', 'Java', 'Python', 'JavaScript', 'SQL'] },
  { label: 'Backend', items: ['FastAPI', 'REST APIs', 'Microservices', 'MQTT'] },
  {
    label: 'ML & AI',
    items: [
      'Scikit-learn',
      'XGBoost',
      'LSTM',
      'SHAP',
      'RAG',
      'FAISS',
      'LangChain',
      'Groq',
    ],
  },
  { label: 'Databases', items: ['PostgreSQL', 'SQLite'] },
  { label: 'Cloud & Tools', items: ['AWS', 'Git', 'Streamlit'] },
];

/* ─── Component ─── */
export function AboutContent() {
  return (
    <div className="section-padding">
      <div className="container-custom max-w-4xl">
        {/* ── Hero ── */}
        <Section>
          <h1 className="font-display text-5xl font-bold tracking-tight">
            About
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            The engineering philosophy, technical depth, and areas of focus
            behind my work.
          </p>
        </Section>

        {/* ── Narrative ── */}
        <Section className="mt-16 space-y-6" delay={0.1}>
          <p className="text-base leading-relaxed text-muted-foreground">
            I&apos;m{' '}
            <span className="text-foreground font-medium">
              Shashi Bhushan Vijay
            </span>
            , a software engineer who designs and builds intelligent systems. My
            work spans machine learning pipelines, distributed architectures,
            indoor localization systems, and AI-powered applications. I hold a
            patent in signal processing for indoor positioning and have built
            production-grade platforms across fintech, IoT, and developer tools.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            My approach to engineering is rooted in understanding the problem
            deeply before writing code. I believe the best systems emerge from
            clear thinking about architecture, trade-offs, and user needs.
          </p>
        </Section>

        {/* ── Divider ── */}
        <div className="my-16 h-px bg-border/60" />

        {/* ── Engineering Principles ── */}
        <Section delay={0.05}>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Engineering Principles
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {principles.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: i * 0.08,
                }}
                className="group rounded-xl border border-border/50 bg-card p-8 transition-colors hover:border-border"
              >
                <p.icon className="mb-4 size-5 text-primary" />
                <h3 className="font-semibold tracking-tight">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ── Divider ── */}
        <div className="my-16 h-px bg-border/60" />

        {/* ── Areas of Expertise ── */}
        <Section delay={0.05}>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Areas of Expertise
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {expertiseAreas.map((area, i) => (
              <motion.span
                key={area}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1],
                  delay: i * 0.04,
                }}
                className="rounded-full border border-border/70 bg-card px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {area}
              </motion.span>
            ))}
          </div>
        </Section>

        {/* ── Divider ── */}
        <div className="my-16 h-px bg-border/60" />

        {/* ── Technical Skills ── */}
        <Section delay={0.05}>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Technical Skills
          </h2>
          <div className="mt-8 space-y-6">
            {skillGroups.map((group, gi) => (
              <motion.div
                key={group.label}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: gi * 0.06,
                }}
                className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <span className="w-28 shrink-0 text-sm font-medium text-foreground">
                  {group.label}
                </span>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-md bg-muted/60 px-2.5 py-1 font-mono text-xs text-muted-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ── Divider ── */}
        <div className="my-16 h-px bg-border/60" />

        {/* ── Education ── */}
        <Section delay={0.05}>
          <div className="flex items-start gap-4">
            <GraduationCap className="mt-1 size-5 text-muted-foreground" />
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                Education
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                <span className="text-foreground font-medium">
                  VIT Vellore
                </span>{' '}
                — Integrated M.Tech, Computer Science &amp; Engineering
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Expected April 2027
              </p>
            </div>
          </div>
        </Section>

        {/* ── Divider ── */}
        <div className="my-16 h-px bg-border/60" />

        {/* ── Vision ── */}
        <Section delay={0.05}>
          <div className="flex items-start gap-4">
            <Sparkles className="mt-1.5 size-5 text-primary" />
            <blockquote className="border-l-2 border-primary/40 pl-6">
              <p className="font-display text-xl font-medium italic leading-relaxed text-foreground/90">
                Build intelligent systems that solve real-world problems at
                scale.
              </p>
            </blockquote>
          </div>
        </Section>
      </div>
    </div>
  );
}
