'use client';

import Link from 'next/link';
import { ArrowDownToLine, Mail } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/icons';
import { ACHIEVEMENTS } from '@/game/data/achievements';
import { INTERVIEW_QUESTIONS } from '@/game/data/questions';
import { PROFILE } from '@/game/data/profile';
import { useGame } from '@/game/store/game-store';
import { EGG_COUNT } from '@/game/systems/progression';
import { buttonStyles } from '@/components/ui/button';
import { OutLink } from '@/game/ui/links';
import { Panel } from '@/game/ui/panel';
import { XpBar } from '@/game/ui/quest-log';

export function EndingPanel({ onClose }: { onClose: () => void }) {
  const p = useGame((s) => s.progress);
  const stats = [
    { label: 'Projects inspected', value: `${p.viewedProjects.length}` },
    { label: 'Achievements', value: `${p.achievements.length} / ${ACHIEVEMENTS.length}` },
    { label: 'Easter eggs', value: `${p.discoveredEasterEggs.length} / ${EGG_COUNT}` },
    { label: 'Interview', value: `${p.interviewScore} / ${INTERVIEW_QUESTIONS.length}` },
  ];

  return (
    <Panel
      kicker="Quest complete"
      title="Thanks for playing SHASHI.EXE"
      onClose={onClose}
      footer={
        <>
          <button type="button" data-autofocus onClick={onClose} className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
            Keep exploring
          </button>
          <Link href="/" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
            Back to the portfolio
          </Link>
        </>
      }
    >
      <p className="max-w-[60ch] text-[15px] leading-relaxed text-fg text-pretty">
        Everything in here is real work: the patent application, the projects, the numbers. If something caught your eye, the full
        write-ups are on the site — and I’d enjoy talking about any of it.
      </p>

      <XpBar xp={p.xp} className="mt-6" />
      <dl className="mt-4 grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-bg px-3 py-2.5">
            <dt className="label-mono text-fg-faint">{s.label}</dt>
            <dd className="mt-1 text-lg font-medium tracking-tight text-fg">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
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
      </div>
    </Panel>
  );
}
