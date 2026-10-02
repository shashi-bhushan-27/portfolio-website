'use client';

import { useEffect, useRef, useState } from 'react';
import { PROJECTS } from '@/game/data/projects';
import { PROFILE } from '@/game/data/profile';
import { gameStore } from '@/game/store/game-store';
import { trackGame } from '@/game/analytics';
import { skillGroups } from '@/lib/content';
import { Panel } from '@/game/ui/panel';

type Line = { kind: 'in' | 'out' | 'link'; text: string; href?: string };

const PROMPT = 'shashi@dev:~$';

function run(raw: string): Line[] | 'clear' | 'exit' {
  const cmd = raw.trim().replace(/\s+/g, ' ');
  const lower = cmd.toLowerCase();
  const out = (...text: string[]): Line[] => text.map((t) => ({ kind: 'out', text: t }));
  if (!cmd) return [];

  switch (lower) {
    case 'help':
      return out('commands: whoami  ls  projects  skills  open resume  contact  clear  exit', '…and a few that aren’t listed.');
    case 'whoami':
      return out(`${PROFILE.name} — ${PROFILE.role}. ${PROFILE.location}.`);
    case 'ls':
      return out('projects/  research/  resume.pdf  secrets/');
    case 'ls secrets':
    case 'ls secrets/':
    case 'cat secrets':
    case 'cd secrets':
      return out('Permission denied. Nice try, though.');
    case 'projects':
    case 'ls projects':
    case 'ls projects/':
      return out(...PROJECTS.map((p) => `  ${p.name.padEnd(36)} ${p.year}`));
    case 'skills':
      return out(...skillGroups.map((g) => `  ${g.label.padEnd(14)} ${g.items.join(', ')}`));
    case 'cat resume.pdf':
      return out('Binary file. Try: open resume');
    case 'open resume':
      trackGame('resume_clicked');
      return [{ kind: 'link', text: 'Opening résumé →', href: PROFILE.links.resume }];
    case 'contact':
      return [{ kind: 'link', text: `${PROFILE.links.email} — or the contact form →`, href: PROFILE.links.contact }];
    case 'sudo hire shashi': {
      const { progress, findEgg } = gameStore.getState();
      findEgg('sudo-hire');
      if (!progress.bossDefeated) return out('Permission denied.', 'Try proving your skills first.');
      trackGame('contact_clicked');
      return [
        ...out('[sudo] password for recruiter: ********', 'Access granted. Opening a channel…'),
        { kind: 'link', text: 'Get in touch →', href: PROFILE.links.contact },
      ];
    }
    case 'hire shashi':
      return out('hire: permission denied. (Have you tried sudo?)');
    case 'rm -rf /':
    case 'sudo rm -rf /':
      return out('Nice try. This portfolio has backups.');
    case 'vim':
    case 'vi':
      return out('You are now trapped in vim. Type :q to escape.');
    case ':q':
    case ':q!':
    case ':wq':
      return out('Free at last.');
    case 'coffee':
      return out('☕  Brewing… productivity +17%. (The real machine is in the hub.)');
    case 'clear':
      return 'clear';
    case 'exit':
    case 'logout':
      return 'exit';
    default:
      return out(`command not found: ${cmd.split(' ')[0]}. Try 'help'.`);
  }
}

export function TerminalPanel({ onClose }: { onClose: () => void }) {
  const [lines, setLines] = useState<Line[]>([
    { kind: 'out', text: 'SHASHI.EXE terminal v0.1 — last login: never' },
    { kind: 'out', text: "Type 'help' to see what it does." },
  ]);
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [lines]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = run(value);
    if (result === 'exit') {
      onClose();
      return;
    }
    setHistory((h) => (value.trim() ? [value, ...h].slice(0, 30) : h));
    setCursor(-1);
    setLines((l) => (result === 'clear' ? [] : [...l, { kind: 'in', text: value }, ...result]));
    setValue('');
  };

  return (
    <Panel kicker="Secret Developer Room · old terminal" title="tty1" onClose={onClose}>
      <div className="bg-[var(--surface)] p-3 font-mono text-[12.5px] leading-relaxed" role="log" aria-live="polite">
        {lines.map((l, i) =>
          l.kind === 'in' ? (
            <p key={i} className="text-fg">
              <span className="text-signal-ink">{PROMPT}</span> {l.text}
            </p>
          ) : l.kind === 'link' ? (
            <p key={i}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-signal-ink link-underline">
                {l.text}
              </a>
            </p>
          ) : (
            <p key={i} className="whitespace-pre-wrap text-fg-muted">
              {l.text}
            </p>
          )
        )}
        <form onSubmit={submit} className="flex items-center gap-2">
          <label htmlFor="tty-input" className="shrink-0 text-signal-ink">
            {PROMPT}
          </label>
          <input
            id="tty-input"
            data-autofocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' && history.length) {
                e.preventDefault();
                const next = Math.min(cursor + 1, history.length - 1);
                setCursor(next);
                setValue(history[next]);
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = cursor - 1;
                setCursor(next);
                setValue(next >= 0 ? history[next] : '');
              }
            }}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-fg caret-[var(--signal)] outline-none"
          />
        </form>
        <div ref={endRef} />
      </div>
    </Panel>
  );
}
