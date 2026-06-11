"use client";

import { useRef, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import { ArrowUpRight, Filter } from "lucide-react";
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

const scaleFade = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

/* ─── scroll-triggered section ─── */
function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

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

/* ─── project card ─── */
function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  return (
    <motion.div
      variants={scaleFade}
      transition={{ duration: 0.5, delay: index * 0.06 }}
    >
      <Link
        href={`/work/${project.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:scale-[1.01] hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
      >
        {/* ── gradient header with icon ── */}
        <div
          className={`relative flex h-48 items-center justify-center bg-gradient-to-br ${project.coverGradient}`}
        >
          <span className="text-6xl" role="img" aria-label={project.title}>
            {project.icon}
          </span>

          {/* hover arrow */}
          <div className="absolute right-4 top-4">
            <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>

        {/* ── content ── */}
        <div className="flex flex-1 flex-col p-8">
          {/* domain badge */}
          <span className="text-xs font-medium uppercase tracking-wider text-primary">
            {project.domain}
          </span>

          {/* title */}
          <h3 className="mt-3 text-2xl font-display font-semibold leading-snug tracking-tight">
            {project.title}
          </h3>

          {/* excerpt */}
          <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
            {project.excerpt}
          </p>

          {/* technologies */}
          <div className="mt-5 flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* year + metrics row */}
          <div className="mt-5 flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              {project.year}
            </span>
            {project.metrics && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(project.metrics).map(([key, value]) => (
                  <span
                    key={key}
                    className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                  >
                    {value}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* view link */}
          <div className="mt-6 flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
            View Case Study
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   WORK PAGE CONTENT
   ═══════════════════════════════════════════════════════ */
export function WorkPageContent({ projects }: { projects: Project[] }) {
  const [activeFilter, setActiveFilter] = useState<string>("All");

  /* derive unique domains */
  const domains = useMemo(() => {
    const unique = Array.from(new Set(projects.map((p) => p.domain)));
    return ["All", ...unique];
  }, [projects]);

  /* filtered projects */
  const filtered = useMemo(() => {
    if (activeFilter === "All") return projects;
    return projects.filter((p) => p.domain === activeFilter);
  }, [activeFilter, projects]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── background effects ── */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-primary/8 via-transparent to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-blue-500/5 via-transparent to-transparent blur-3xl" />
      </div>

      {/* ── page header ── */}
      <Section className="mx-auto w-full max-w-7xl px-6 pt-32 pb-16 lg:px-8">
        <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Portfolio
          </span>
          <h1 className="mt-4 text-5xl font-display font-bold tracking-tight">
            Engineering Work
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            A collection of engineering case studies — from patent-backed ML
            systems and AI platforms to quantitative finance and blockchain
            applications.
          </p>
        </motion.div>

        {/* ── filter pills ── */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <Filter className="h-4 w-4 text-muted-foreground" />
          {domains.map((domain) => (
            <button
              key={domain}
              onClick={() => setActiveFilter(domain)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                activeFilter === domain
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {domain}
            </button>
          ))}
        </motion.div>
      </Section>

      {/* ── project grid ── */}
      <Section className="mx-auto w-full max-w-7xl px-6 pb-32 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          {filtered.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            className="py-20 text-center text-muted-foreground"
          >
            No projects found for this filter.
          </motion.p>
        )}
      </Section>
    </div>
  );
}
