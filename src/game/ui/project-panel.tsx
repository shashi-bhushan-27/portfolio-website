'use client';

import { GithubIcon } from '@/components/icons';
import { projectById } from '@/game/data/projects';
import { useGame } from '@/game/store/game-store';
import { IndoorNavDemo } from '@/game/ui/indoor-nav-demo';
import { Metrics, OutLink, TechChips } from '@/game/ui/links';
import { Panel, PanelSection } from '@/game/ui/panel';
import { Pipeline } from '@/game/ui/pipeline';

export function ProjectPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const project = projectById(id);
  const published = useGame((s) => s.publishedSlugs.includes(id));
  if (!project) return null;

  return (
    <Panel
      kicker={`Project Garage · ${project.domain} · ${project.year}`}
      title={project.name}
      onClose={onClose}
      size="lg"
      footer={
        <>
          {published && (
            <OutLink href={`/work/${project.id}`} variant="primary">
              View full project
            </OutLink>
          )}
          {project.github && (
            <OutLink href={project.github} event="github_clicked">
              <GithubIcon className="size-3.5" />
              GitHub
            </OutLink>
          )}
          {project.demo && <OutLink href={project.demo}>Live demo</OutLink>}
          {!project.github && !published && (
            <span className="label-mono text-fg-faint">Source is private · ask me for a walkthrough</span>
          )}
        </>
      }
    >
      <p className="text-[15px] leading-relaxed text-fg text-pretty">{project.tagline}</p>
      {project.note && <p className="label-mono mt-2 text-signal-ink">{project.note}</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <PanelSection label="Problem">
          <p className="text-sm leading-relaxed text-fg-muted">{project.problem}</p>
        </PanelSection>
        <PanelSection label="Solution">
          <p className="text-sm leading-relaxed text-fg-muted">{project.solution}</p>
        </PanelSection>
      </div>

      {project.id === 'indoor-positioning-system' ? (
        <PanelSection label="Try it: locate and route">
          <IndoorNavDemo steps={project.pipeline} />
        </PanelSection>
      ) : (
        <div className="grid gap-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
          <PanelSection label="Architecture">
            <Pipeline steps={project.pipeline} label={`${project.name} architecture`} />
          </PanelSection>
          <PanelSection label="What I built">
            <BuiltList items={project.built} />
          </PanelSection>
        </div>
      )}

      {project.id === 'indoor-positioning-system' && (
        <PanelSection label="What I built">
          <BuiltList items={project.built} />
        </PanelSection>
      )}

      <PanelSection label="Results">
        <Metrics items={project.results} />
      </PanelSection>

      <PanelSection label="Tech stack">
        <TechChips items={project.stack} />
      </PanelSection>
    </Panel>
  );
}

function BuiltList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((b) => (
        <li key={b} className="flex gap-3 text-sm leading-relaxed text-fg-muted">
          <span aria-hidden className="mt-[0.55em] size-1.5 shrink-0 bg-signal" />
          {b}
        </li>
      ))}
    </ul>
  );
}
