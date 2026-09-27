"use client";

import { useMemo, useState } from "react";
import type { ProjectData } from "@/lib/types";
import { ProjectRow } from "@/components/work/project-row";
import { cn } from "@/lib/utils";

export function WorkPageContent({ projects }: { projects: ProjectData[] }) {
  const [filter, setFilter] = useState("All");

  const domains = useMemo(() => {
    const counts = new Map<string, number>();
    // Group "AI / NLP" and "AI / HRTech / SaaS" under their first segment for a shorter filter row.
    for (const p of projects) {
      const key = p.domain.split("/")[0].trim();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [["All", projects.length] as const, ...counts.entries()];
  }, [projects]);

  const filtered = useMemo(
    () =>
      filter === "All"
        ? projects
        : projects.filter((p) => p.domain.split("/")[0].trim() === filter),
    [filter, projects]
  );

  return (
    <div className="container-page">
      <div
        className="-mx-1 flex flex-wrap gap-1 border-y border-line py-4"
        role="tablist"
        aria-label="Filter by domain"
      >
        {domains.map(([name, count]) => (
          <button
            key={name}
            role="tab"
            aria-selected={filter === name}
            onClick={() => setFilter(name)}
            className={cn(
              "rounded-[4px] px-2.5 py-1.5 text-[13px] transition-colors",
              filter === name ? "bg-fg text-bg" : "text-fg-muted hover:bg-surface hover:text-fg"
            )}
          >
            {name}
            <span
              className={cn(
                "ml-1.5 font-mono text-[11px]",
                filter === name ? "opacity-60" : "text-fg-faint"
              )}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      <ol>
        {filtered.map((p) => (
          <ProjectRow key={p.slug} project={p} n={projects.indexOf(p) + 1} showStack />
        ))}
      </ol>

      {filtered.length === 0 && (
        <p className="py-20 text-center text-fg-muted">No projects in this domain.</p>
      )}
    </div>
  );
}
