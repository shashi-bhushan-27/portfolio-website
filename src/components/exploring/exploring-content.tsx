'use client';

import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

/* ─── Data ─── */
type Status = 'Active' | 'Exploring' | 'Paused';

interface Topic {
  title: string;
  status: Status;
  description: string;
}

const topics: Topic[] = [
  {
    title: 'Advanced System Design',
    status: 'Active',
    description:
      'Studying distributed system patterns, consensus algorithms, and scalable architectures.',
  },
  {
    title: 'AI Agents & Autonomous Systems',
    status: 'Active',
    description:
      'Exploring multi-agent architectures, tool-use patterns, and autonomous reasoning systems.',
  },
  {
    title: 'LLM Applications & RAG',
    status: 'Active',
    description:
      'Building production RAG pipelines, fine-tuning strategies, and prompt engineering.',
  },
  {
    title: 'ML Deployment & MLOps',
    status: 'Active',
    description:
      'Model serving, monitoring, A/B testing, and continuous training pipelines.',
  },
  {
    title: 'Cloud Infrastructure',
    status: 'Exploring',
    description:
      'AWS services, serverless architectures, and infrastructure as code.',
  },
  {
    title: 'High-Performance Systems',
    status: 'Exploring',
    description:
      'Low-latency systems, caching strategies, and performance optimization.',
  },
  {
    title: 'Quantitative Finance',
    status: 'Paused',
    description:
      'Options pricing models, algorithmic trading, and risk management systems.',
  },
  {
    title: 'Blockchain & Web3',
    status: 'Paused',
    description:
      'Smart contract patterns, DeFi protocols, and decentralized architectures.',
  },
];

const statusColor: Record<Status, { dot: string; text: string }> = {
  Active: { dot: 'bg-emerald-500', text: 'text-emerald-400' },
  Exploring: { dot: 'bg-blue-500', text: 'text-blue-400' },
  Paused: { dot: 'bg-amber-500', text: 'text-amber-400' },
};

/* ─── Component ─── */
export function ExploringContent() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' });

  return (
    <div className="section-padding">
      <div className="container-custom max-w-4xl">
        {/* ── Hero ── */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 32 }}
          animate={
            headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }
          }
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-display text-5xl font-bold tracking-tight">
            What I&apos;m Exploring
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            A public engineering journal of topics I&apos;m actively researching
            and experimenting with.
          </p>
        </motion.div>

        {/* ── Grid ── */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {topics.map((topic, i) => {
            const color = statusColor[topic.status];
            return (
              <motion.article
                key={topic.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: i * 0.06,
                }}
                className="group rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-border"
              >
                {/* Status badge */}
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={`inline-block size-2 rounded-full ${color.dot}`}
                  />
                  <span
                    className={`text-xs font-medium uppercase tracking-wider ${color.text}`}
                  >
                    {topic.status}
                  </span>
                </div>

                <h3 className="text-lg font-semibold tracking-tight">
                  {topic.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {topic.description}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
