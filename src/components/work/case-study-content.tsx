import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { Markdown } from "@/components/markdown/markdown";
import { TableOfContents } from "@/components/insights/article-islands";
import { buttonStyles } from "@/components/ui/button";
import type { ProjectData } from "@/lib/types";

type Neighbor = { slug: string; title: string } | null;

export function CaseStudyContent({
  project,
  next,
}: {
  project: ProjectData;
  next: Neighbor;
}) {
  const sections = [
    { id: "summary", title: "Executive summary", body: project.executiveSummary },
    { id: "problem", title: "Problem statement", body: project.problemStatement },
    { id: "architecture", title: "System architecture", body: project.systemArchitecture },
    { id: "decisions", title: "Technology decisions", body: project.technologyDecisions },
    { id: "tradeoffs", title: "Engineering trade-offs", body: project.engineeringTradeoffs },
    { id: "challenges", title: "Challenges & solutions", body: null },
    { id: "performance", title: "Performance", body: project.performanceMetrics },
    { id: "lessons", title: "Lessons learned", body: project.lessonsLearned },
    { id: "future", title: "Future improvements", body: project.futureImprovements },
  ].filter((s) =>
    s.body === null
      ? project.challengesFaced.trim() || project.solutionsImplemented.trim()
      : s.body.trim()
  );

  const challengeColumns = [
    { label: "Challenges", tone: "text-danger", body: project.challengesFaced },
    { label: "Solutions", tone: "text-signal-ink", body: project.solutionsImplemented },
  ].filter((c) => c.body.trim());

  const metrics = Object.entries(project.metrics ?? {});

  return (
    <article>
      <header className="container-page pt-28 sm:pt-36">
        <nav className="label-mono flex items-center gap-2 text-fg-faint" aria-label="Breadcrumb">
          <Link href="/work" className="group inline-flex items-center gap-1.5 hover:text-fg">
            <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" />
            work
          </Link>
          <span>/</span>
          <span>{project.slug}</span>
        </nav>

        <p className="label-mono mt-10 flex gap-4 text-fg-muted">
          <span>{project.domain}</span>
          <span className="text-fg-faint">{project.year}</span>
        </p>
        <h1 className="mt-4 max-w-4xl text-[clamp(2.2rem,5vw,4rem)] leading-[1.03] font-medium tracking-[-0.04em] text-fg text-balance">
          {project.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted text-pretty">
          {project.excerpt}
        </p>

        {(project.githubUrl || project.liveUrl) && (
          <div className="mt-8 flex flex-wrap gap-3">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({ variant: "primary" })}
              >
                Live demo
                <ArrowUpRight className="size-4" />
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({ variant: "secondary" })}
              >
                <GithubIcon className="size-4" />
                Source
              </a>
            )}
          </div>
        )}

        <dl className="mt-12 border-y border-line">
          {metrics.length > 0 && (
            <div className="flex flex-wrap border-b border-line">
              {metrics.map(([k, v]) => (
                <div key={k} className="border-l border-line px-5 py-5 first:border-l-0 first:pl-0">
                  <dt className="label-mono text-fg-faint">{k}</dt>
                  <dd className="mt-2 font-mono text-xl tracking-tight text-fg">{v}</dd>
                </div>
              ))}
            </div>
          )}
          <div className="py-5">
            <dt className="label-mono text-fg-faint">Stack</dt>
            <dd className="mt-3 flex flex-wrap gap-1.5">
              {project.technologies.map((t) => (
                <span key={t} className="rounded-[3px] border border-line px-2 py-1 font-mono text-[11.5px] text-fg-muted">
                  {t}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </header>

      <div className="container-page mt-16 grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <TableOfContents
              items={sections.map((s) => ({ id: s.id, text: s.title, depth: 2 as const }))}
            />
          </div>
        </aside>

        <div className="max-w-[68ch] min-w-0">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 border-t border-line pt-6 pb-12 first:border-t-0 first:pt-0">
              <h2 className="flex items-baseline gap-4 text-xl font-medium tracking-[-0.02em] text-fg">
                <span className="label-mono text-fg-faint">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              {s.body !== null ? (
                <Markdown source={s.body} className={i === 0 ? "mt-5 [&>p:first-child]:text-lg [&>p:first-child]:text-fg" : "mt-5"} />
              ) : (
                <div className={`mt-6 grid gap-px bg-line ${challengeColumns.length > 1 ? "sm:grid-cols-2" : ""}`}>
                  {challengeColumns.map((c) => (
                    <div key={c.label} className="bg-bg p-5">
                      <p className={`label-mono ${c.tone}`}>{c.label}</p>
                      <Markdown source={c.body} className="mt-3 text-[15px]" />
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>

      <nav className="container-page mt-16 grid border-t border-line sm:grid-cols-2" aria-label="Project navigation">
        <Link href="/work" className="group flex items-center gap-3 py-8 text-fg-muted hover:text-fg">
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          <span className="label-mono">All projects</span>
        </Link>
        {next && (
          <Link
            href={`/work/${next.slug}`}
            className="group flex flex-col items-end gap-2 border-line py-8 text-right sm:border-l"
          >
            <span className="label-mono text-fg-faint">Next project</span>
            <span className="flex items-center gap-2 text-lg font-medium tracking-[-0.01em] text-fg group-hover:text-signal-ink">
              {next.title}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        )}
      </nav>
    </article>
  );
}
