"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { GithubIcon as Github } from "@/components/icons";
import type { ProjectData } from "@/lib/types";

type Project = ProjectData;

/* ─── animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

/* ─── scroll-triggered section ─── */
function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeUp}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── content section block ─── */
function ContentSection({
  title,
  content,
  delay = 0,
}: {
  title: string;
  content: string;
  delay?: number;
}) {
  return (
    <AnimatedSection className="py-8" delay={delay}>
      <h2 className="text-2xl font-display font-semibold tracking-tight">
        {title}
      </h2>
      <p className="mt-4 text-muted-foreground leading-relaxed">{content}</p>
    </AnimatedSection>
  );
}

/* ═══════════════════════════════════════════════════════
   CASE STUDY CONTENT
   ═══════════════════════════════════════════════════════ */
export function CaseStudyContent({ project }: { project: Project }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── hero section ── */}
      <section
        className={`relative overflow-hidden bg-gradient-to-br ${project.coverGradient}`}
      >
        {/* dot grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pt-28 pb-20 lg:px-8">
          {/* back link */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="/work"
              className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Work
            </Link>
          </motion.div>

          {/* icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8"
          >
            <span className="text-6xl" role="img" aria-label={project.title}>
              {project.icon}
            </span>
          </motion.div>

          {/* domain + year */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 flex items-center gap-3"
          >
            <span className="text-xs font-medium uppercase tracking-wider text-primary">
              {project.domain}
            </span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {project.year}
            </span>
          </motion.div>

          {/* title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-4 text-4xl font-display font-bold tracking-tight md:text-5xl"
          >
            {project.title}
          </motion.h1>

          {/* excerpt */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-4 max-w-2xl text-lg text-muted-foreground"
          >
            {project.excerpt}
          </motion.p>

          {/* technologies */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="mt-8 flex flex-wrap gap-2"
          >
            {project.technologies.map((tech, i) => (
              <motion.span
                key={tech}
                variants={fadeUp}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.04 }}
                className="rounded-full border border-border/60 bg-background/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm"
              >
                {tech}
              </motion.span>
            ))}
          </motion.div>

          {/* external links */}
          {(project.githubUrl || project.liveUrl) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Github className="h-4 w-4" />
                  Source Code
                </a>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03] active:scale-[0.98]"
                >
                  <ExternalLink className="h-4 w-4" />
                  Live Demo
                </a>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── metrics cards ── */}
      {project.metrics && (
        <section className="border-b border-border/50">
          <div className="mx-auto w-full max-w-4xl px-6 py-12 lg:px-8">
            <AnimatedSection>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Object.entries(project.metrics).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-border/50 bg-card p-5 text-center"
                  >
                    <div className="text-2xl font-display font-bold text-primary">
                      {value}
                    </div>
                    <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {key}
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ── editorial content ── */}
      <article className="mx-auto w-full max-w-4xl px-6 py-16 lg:px-8">
        {/* Executive Summary — highlighted card */}
        <AnimatedSection>
          <div className="rounded-xl border-l-4 border-primary bg-card/50 p-8">
            <h2 className="text-2xl font-display font-semibold tracking-tight">
              Executive Summary
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {project.executiveSummary}
            </p>
          </div>
        </AnimatedSection>

        {/* divider */}
        <div className="my-4 border-b border-border/30" />

        {/* Problem Statement */}
        <ContentSection title="Problem Statement" content={project.problemStatement} />

        <div className="border-b border-border/30" />

        {/* System Architecture */}
        <ContentSection
          title="System Architecture"
          content={project.systemArchitecture}
        />

        <div className="border-b border-border/30" />

        {/* Technology Decisions */}
        <ContentSection
          title="Technology Decisions"
          content={project.technologyDecisions}
        />

        <div className="border-b border-border/30" />

        {/* Engineering Trade-offs */}
        <ContentSection
          title="Engineering Trade-offs"
          content={project.engineeringTradeoffs}
        />

        <div className="border-b border-border/30" />

        {/* Challenges & Solutions — two column */}
        <AnimatedSection className="py-8">
          <h2 className="text-2xl font-display font-semibold tracking-tight">
            Challenges &amp; Solutions
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400">
                Challenges Faced
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {project.challengesFaced}
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                Solutions Implemented
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {project.solutionsImplemented}
              </p>
            </div>
          </div>
        </AnimatedSection>

        <div className="border-b border-border/30" />

        {/* Performance Metrics */}
        <ContentSection
          title="Performance Metrics"
          content={project.performanceMetrics}
        />

        <div className="border-b border-border/30" />

        {/* Lessons Learned */}
        <ContentSection
          title="Lessons Learned"
          content={project.lessonsLearned}
        />

        <div className="border-b border-border/30" />

        {/* Future Improvements */}
        <ContentSection
          title="Future Improvements"
          content={project.futureImprovements}
        />

        {/* ── bottom nav ── */}
        <AnimatedSection className="mt-16 flex items-center justify-between border-t border-border/50 pt-10">
          <Link
            href="/work"
            className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            All Projects
          </Link>
        </AnimatedSection>
      </article>
    </div>
  );
}
