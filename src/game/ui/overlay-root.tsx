'use client';

import { Component, type ReactNode } from 'react';
import { gameStore, useGame, type PanelState } from '@/game/store/game-store';
import { AiTerminalPanel } from '@/game/ui/ai-terminal-panel';
import { BossPanel } from '@/game/ui/boss-panel';
import { DialogueBox } from '@/game/ui/dialogue-box';
import { DsaPanel } from '@/game/ui/dsa-panel';
import { EndingPanel } from '@/game/ui/ending-panel';
import { InfoPanel } from '@/game/ui/info-panel';
import { InterviewPanel } from '@/game/ui/interview-panel';
import { PauseMenu } from '@/game/ui/pause-menu';
import { ProjectPanel } from '@/game/ui/project-panel';
import { AchievementsPanel, QuestLog } from '@/game/ui/quest-log';
import { RecruiterMode } from '@/game/ui/recruiter-mode';
import { StartupPanel } from '@/game/ui/startup-panel';
import { TerminalPanel } from '@/game/ui/terminal-panel';
import { TrophyPanel } from '@/game/ui/trophy-panel';

const close = () => gameStore.getState().closePanel();

function render(panel: PanelState) {
  switch (panel.kind) {
    case 'dialogue':
      return <DialogueBox key={`d-${panel.id}`} id={panel.id} />;
    case 'project':
      return <ProjectPanel key={`p-${panel.id}`} id={panel.id} onClose={close} />;
    case 'ai-terminal':
      return <AiTerminalPanel key={`a-${panel.id}`} id={panel.id} onClose={close} />;
    case 'trophy':
      return <TrophyPanel key={`t-${panel.id}`} id={panel.id} onClose={close} />;
    case 'info':
      return <InfoPanel key={`i-${panel.id}`} id={panel.id} onClose={close} />;
    case 'dsa':
      return <DsaPanel key="dsa" onClose={close} />;
    case 'interview':
      return <InterviewPanel key="interview" onClose={close} />;
    case 'boss':
      return <BossPanel key="boss" onClose={close} />;
    case 'startup':
      return <StartupPanel key="startup" onClose={close} />;
    case 'terminal':
      return <TerminalPanel key="terminal" onClose={close} />;
    case 'quests':
      return <QuestLog key="quests" onClose={close} />;
    case 'achievements':
      return <AchievementsPanel key="achievements" onClose={close} />;
    case 'pause':
      return <PauseMenu key="pause" onClose={close} />;
    case 'recruiter':
      return <RecruiterMode key="recruiter" onClose={close} />;
    case 'ending':
      return <EndingPanel key="ending" onClose={close} />;
  }
}

/**
 * A panel that throws closes itself instead of taking the whole game down with it
 * (the route-level error.tsx would otherwise replace the world with the error screen).
 */
class PanelBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[shashi.exe] a panel failed', error);
    const store = gameStore.getState();
    store.closePanel();
    store.notify('That panel hit an error', 'It’s been closed; the rest of the game is fine.');
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function OverlayRoot() {
  const panel = useGame((s) => s.panel);
  if (!panel) return null;
  // Keyed by panel, so the boundary resets for the next one.
  return <PanelBoundary key={JSON.stringify(panel)}>{render(panel)}</PanelBoundary>;
}
