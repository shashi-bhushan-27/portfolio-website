'use client';

import { ArrowDownToLine, Mail } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/icons';
import { projectById } from '@/game/data/projects';
import { PROFILE } from '@/game/data/profile';
import { useGame } from '@/game/store/game-store';
import { OutLink } from '@/game/ui/links';
import { Panel, PanelSection } from '@/game/ui/panel';

/** The whole portfolio on one card — for anyone who doesn't want to play. */
export function RecruiterMode({ onClose }: { onClose: () => void }) {
  const published = useGame((s) => s.publishedSlugs);

  return (
    <Panel
      kicker="Recruiter mode · quick profile"
      title={PROFILE.name}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <OutLink href={PROFILE.links.resume} event="resume_clicked" variant="primary">
            <ArrowDownToLine className="size-3.5" /> Résumé
          </OutLink>
          <OutLink href={PROFILE.links.github} event="github_clicked">
            <GithubIcon className="size-3.5" /> GitHub
          </OutLink>
          <OutLink href={PROFILE.links.linkedin} event="linkedin_clicked">
            <LinkedinIcon className="size-3.5" /> LinkedIn
          </OutLink>
          <OutLink href={PROFILE.links.contact} event="contact_clicked">
            <Mail className="size-3.5" /> Contact
          </OutLink>
        </>
      }
    >
      <p className="text-[15px] text-fg">
        {PROFILE.role} <span className="text-fg-faint">·</span> <span className="text-fg-muted">{PROFILE.location}</span>
      </p>
      <p className="mt-1 text-sm text-fg-muted">{PROFILE.education}</p>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <PanelSection label="Top projects">
          <ol className="divide-y divide-line border-y border-line">
            {PROFILE.topProjects.map((id, i) => {
              const p = projectById(id);
              if (!p) return null;
              const href = published.includes(id) ? `/work/${id}` : p.github;
              return (
                <li key={id} className="flex gap-3 py-3">
                  <span className="font-mono text-[11px] text-fg-faint">{String(i + 1).padStart(2, '0')}</span>
                  <div className="min-w-0">
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-fg link-underline hover:text-signal-ink">
                        {p.name}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-fg">{p.name}</p>
                    )}
                    <p className="mt-0.5 text-[13px] leading-relaxed text-fg-muted">{p.tagline}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </PanelSection>

        <div>
          <PanelSection label="Patent">
            <p className="text-sm text-fg">{PROFILE.patent}</p>
          </PanelSection>
          <PanelSection label="Core">
            <p className="font-mono text-[13px] text-fg">{PROFILE.core.join('  |  ')}</p>
          </PanelSection>
          <PanelSection label="Highlights">
            <ul className="space-y-1.5">
              {PROFILE.highlights.map((h) => (
                <li key={h} className="flex gap-2.5 text-[13px] leading-relaxed text-fg-muted">
                  <span aria-hidden className="mt-[0.55em] size-1.5 shrink-0 bg-signal" />
                  {h}
                </li>
              ))}
            </ul>
          </PanelSection>
        </div>
      </div>
    </Panel>
  );
}
