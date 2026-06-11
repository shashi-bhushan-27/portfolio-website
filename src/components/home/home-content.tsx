"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { ArrowRight, ArrowUpRight, Download } from "lucide-react";
import { siteConfig } from "@/lib/constants";
import type { ProjectData, MilestoneData } from "@/lib/types";

/* ─── animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const scaleFade = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

/* ─── reusable section wrapper with scroll trigger ─── */
function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════ */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* ── dot grid background ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── gradient orb ── */}
      <div className="pointer-events-none absolute top-1/3 -right-32 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-orange-500/20 via-blue-500/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-orange-600/10 via-transparent to-transparent blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 lg:px-8">
        <div className="flex flex-col-reverse items-center gap-16 lg:flex-row lg:gap-20">
          {/* ── text column ── */}
          <motion.div
            className="flex-1 flex flex-col items-center text-center lg:items-start lg:text-left"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.span
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground"
            >
              Software Engineer &amp; System Designer
            </motion.span>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl"
            >
              {siteConfig.headline}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
            >
              {siteConfig.subheadline}
            </motion.p>

            {/* tags */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="mt-8 flex flex-wrap justify-center gap-2 lg:justify-start"
            >
              {siteConfig.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {tag}
                </span>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
            >
              <Link
                href="/work"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                Explore Work
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/research"
                className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-3 text-sm font-medium text-foreground transition-colors hover:border-muted-foreground"
              >
                View Research
              </Link>
              <a
                href="/resume/shashi-bhushan-vijay-resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Download className="h-4 w-4" />
                Resume
              </a>
            </motion.div>
          </motion.div>

          {/* ── portrait ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative flex-shrink-0"
          >
            <div className="relative h-64 w-64 overflow-hidden rounded-2xl border border-border/60 shadow-2xl shadow-primary/5 md:h-80 md:w-80 lg:h-[400px] lg:w-[400px]">
              <Image
                src="https://res.cloudinary.com/djdvvscoe/image/upload/v1781194339/portfolio/portrait.jpg"
                alt={siteConfig.name}
                width={400}
                height={400}
                priority
                className="h-full w-full object-cover"
              />
            </div>
            {/* subtle glow behind portrait */}
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-blue-500/5 blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FEATURED WORK
   ═══════════════════════════════════════════════════════ */
function FeaturedWork({ projects }: { projects: ProjectData[] }) {
  return (
    <Section className="mx-auto w-full max-w-7xl px-6 py-32 lg:px-8">
      {/* header */}
      <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="mb-16">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Selected Work
        </h2>
        <p className="mt-3 text-muted-foreground">
          Engineering case studies and production systems
        </p>
      </motion.div>

      {/* cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <motion.div
            key={project.slug}
            variants={scaleFade}
            transition={{ duration: 0.5 }}
          >
            <Link
              href={`/work/${project.slug}`}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-lg hover:shadow-primary/5"
            >
              {/* gradient header */}
              <div
                className={`relative flex items-center gap-4 bg-gradient-to-br ${project.coverGradient} px-6 pt-6 pb-4`}
              >
                <span className="text-3xl" role="img" aria-label={project.title}>
                  {project.icon}
                </span>
                <div className="flex-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {project.domain}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {" "}
                    · {project.year}
                  </span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>

              {/* body */}
              <div className="flex flex-1 flex-col px-6 py-5">
                <h3 className="text-lg font-semibold leading-snug tracking-tight">
                  {project.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {project.excerpt}
                </p>

                {/* metrics */}
                {project.metrics && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {Object.entries(project.metrics).map(([key, value]) => (
                      <span
                        key={key}
                        className="rounded-md bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                )}

                {/* technologies */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {project.technologies.slice(0, 5).map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-border/60 px-2.5 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 5 && (
                    <span className="rounded-full border border-border/60 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                      +{project.technologies.length - 5}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* view all */}
      <motion.div
        variants={fadeUp}
        transition={{ duration: 0.5 }}
        className="mt-12 flex justify-center"
      >
        <Link
          href="/work"
          className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View All Work
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   ENGINEERING MILESTONES
   ═══════════════════════════════════════════════════════ */
function EngineeringMilestones({ milestones }: { milestones: MilestoneData[] }) {
  return (
    <Section className="mx-auto w-full max-w-7xl px-6 py-32 lg:px-8">
      <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="mb-16">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Engineering Milestones
        </h2>
        <p className="mt-3 text-muted-foreground">
          Key inflection points in my engineering journey
        </p>
      </motion.div>

      <div className="relative ml-4 border-l-2 border-border pl-8 md:ml-8 md:pl-12">
        {milestones.map((milestone, i) => (
          <motion.div
            key={milestone.id}
            variants={fadeUp}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="relative pb-12 last:pb-0"
          >
            {/* dot on timeline */}
            <div className="absolute -left-[calc(2rem+5px)] top-1 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background md:-left-[calc(3rem+5px)]" />

            {/* year badge */}
            <span className="inline-flex items-center rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
              {milestone.year}
            </span>

            <h3 className="mt-3 text-lg font-semibold tracking-tight">
              {milestone.title}
            </h3>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {milestone.description}
            </p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   CONTACT CTA
   ═══════════════════════════════════════════════════════ */
function ContactCTA() {
  return (
    <Section className="mx-auto w-full max-w-7xl px-6 py-32 lg:px-8">
      <motion.div
        variants={fadeUp}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-border/50 bg-card px-8 py-20 text-center md:px-16"
      >
        {/* subtle background orb */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Let&apos;s Build Something Together
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            I&apos;m interested in challenging engineering problems — from ML systems
            and distributed architectures to full-stack product development.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Get in Touch
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={`mailto:${siteConfig.links.email}`}
              className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-3 text-sm font-medium text-foreground transition-colors hover:border-muted-foreground"
            >
              {siteConfig.links.email}
            </a>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   HOME CONTENT — receives data from server component
   ═══════════════════════════════════════════════════════ */
export function HomeContent({
  featuredProjects,
  milestones,
}: {
  featuredProjects: ProjectData[];
  milestones: MilestoneData[];
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <FeaturedWork projects={featuredProjects} />
      <EngineeringMilestones milestones={milestones} />
      <ContactCTA />
    </main>
  );
}
