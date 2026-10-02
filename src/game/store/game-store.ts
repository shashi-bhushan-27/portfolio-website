import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { trackGame } from '@/game/analytics';
import { ACHIEVEMENTS } from '@/game/data/achievements';
import { npcDialogue, DIALOGUES, type DialogueAction, type DialogueId } from '@/game/data/dialogues';
import { INFO } from '@/game/data/info';
import { QUESTS } from '@/game/data/quests';
import type { AreaId } from '@/game/data/world';
import { audio, type SoundName } from '@/game/systems/audio';
import { worldEffects } from '@/game/systems/events';
import {
  addOnce,
  EGG_COUNT,
  emptyProgress,
  settle,
  XP,
  type EggId,
  type Progress,
  type ProgressEvent,
} from '@/game/systems/progression';
import { clearSave, defaultSettings, loadSave, writeSave, type Settings } from '@/game/systems/save-system';
import type { Interactable } from '@/game/systems/world-builder';

export type PanelState =
  | { kind: 'dialogue'; id: DialogueId }
  | { kind: 'project'; id: string }
  | { kind: 'ai-terminal'; id: string }
  | { kind: 'trophy'; id: string }
  | { kind: 'info'; id: string }
  | { kind: 'dsa' }
  | { kind: 'interview' }
  | { kind: 'boss' }
  | { kind: 'startup' }
  | { kind: 'terminal' }
  | { kind: 'quests' }
  | { kind: 'achievements' }
  | { kind: 'pause' }
  | { kind: 'recruiter' }
  | { kind: 'ending' };

export type Toast = {
  id: number;
  kind: 'xp' | 'quest' | 'achievement' | 'egg' | 'level' | 'note';
  title: string;
  detail?: string;
};

type GameState = {
  ready: boolean;
  entered: boolean;
  progress: Progress;
  settings: Settings;
  persistence: 'ok' | 'unavailable';
  publishedSlugs: string[];
  panel: PanelState | null;
  area: AreaId | null;
  nearby: Interactable | null;
  toasts: Toast[];
  /** Session-only fun. */
  coffeeUntil: number;
  golden: boolean;
  wallKnocks: number;
};

type Actions = {
  init: (publishedSlugs: string[]) => void;
  enterWorld: () => void;
  openPanel: (panel: PanelState) => void;
  closePanel: () => void;
  interact: (target: Interactable) => void;
  dialogueEnded: (id: DialogueId) => void;
  dialogueAction: (action: DialogueAction) => void;
  setArea: (area: AreaId | null) => void;
  setNearby: (nearby: Interactable | null) => void;
  answerDsa: (questionId: string, correct: boolean) => void;
  finishDsa: (score: number) => void;
  finishInterview: (score: number) => void;
  defeatBoss: () => void;
  finishStartup: () => void;
  findEgg: (egg: EggId) => void;
  konami: () => void;
  setSound: (on: boolean) => void;
  setReducedMotion: (value: boolean | null) => void;
  resetProgress: () => void;
  dismissToast: (id: number) => void;
  notify: (title: string, detail?: string) => void;
};

let toastId = 0;
const MAX_TOASTS = 4;

export const gameStore = createStore<GameState & Actions>()((set, get) => {
  const toast = (t: Omit<Toast, 'id'>) =>
    set((s) => ({ toasts: [...s.toasts, { ...t, id: ++toastId }].slice(-MAX_TOASTS) }));

  const sound = (name: SoundName) => audio.play(name);

  const persist = () => {
    const { progress, settings, persistence } = get();
    if (persistence === 'unavailable') return;
    if (!writeSave(progress, settings)) {
      set({ persistence: 'unavailable' });
      toast({ kind: 'note', title: 'Progress won’t be saved', detail: 'This browser is blocking storage.' });
    }
  };

  const announce = (e: ProgressEvent) => {
    switch (e.kind) {
      case 'xp':
        toast({ kind: 'xp', title: `+${e.amount} XP`, detail: e.reason });
        sound('xp');
        break;
      case 'quest': {
        const q = QUESTS.find((x) => x.id === e.id)!;
        toast({ kind: 'quest', title: `Quest complete: ${q.title}`, detail: `+${q.rewardXP} XP` });
        sound('quest');
        worldEffects.emit({ kind: 'celebrate' });
        break;
      }
      case 'achievement': {
        const a = ACHIEVEMENTS.find((x) => x.id === e.id)!;
        toast({ kind: 'achievement', title: `Achievement: ${a.title}`, detail: a.description });
        sound('achievement');
        worldEffects.emit({ kind: 'celebrate' });
        break;
      }
      case 'egg':
        toast({
          kind: 'egg',
          title: 'Easter egg found',
          detail: `${get().progress.discoveredEasterEggs.length} of ${EGG_COUNT}`,
        });
        sound('unlock');
        trackGame('easter_egg_found', { egg: e.id }, { once: true });
        break;
      case 'level':
        toast({ kind: 'level', title: `Level ${e.level}` });
        break;
    }
  };

  /** The one way progress changes: apply, settle quests/achievements, save, announce. */
  const commit = (next: Progress, events: ProgressEvent[] = []) => {
    const { progress, events: all } = settle(get().progress, next, events);
    set({ progress });
    persist();
    all.forEach(announce);
  };

  const gain = (p: Progress, amount: number, reason: string, events: ProgressEvent[]) => {
    events.push({ kind: 'xp', amount, reason });
    return { ...p, xp: p.xp + amount };
  };

  return {
    ready: false,
    entered: false,
    progress: emptyProgress(),
    settings: defaultSettings(),
    persistence: 'ok',
    publishedSlugs: [],
    panel: null,
    area: null,
    nearby: null,
    toasts: [],
    coffeeUntil: 0,
    golden: false,
    wallKnocks: 0,

    init(publishedSlugs) {
      if (get().ready) return;
      const loaded = loadSave();
      set({
        ready: true,
        publishedSlugs,
        progress: loaded.data.progress,
        settings: loaded.data.settings,
        persistence: loaded.status === 'unavailable' ? 'unavailable' : 'ok',
      });
      if (loaded.status === 'reset') {
        toast({ kind: 'note', title: 'Saved progress was unreadable', detail: 'Starting fresh.' });
      } else if (loaded.status === 'unavailable') {
        toast({ kind: 'note', title: 'Progress won’t be saved', detail: 'This browser is blocking storage.' });
      }
    },

    enterWorld() {
      if (get().entered) return;
      const { progress, settings } = get();
      set({ entered: true });
      trackGame('game_started', { returning: progress.enteredWorld });
      if (settings.sound) void audio.setEnabled(true);
      if (!progress.enteredWorld) {
        const events: ProgressEvent[] = [];
        commit(gain({ ...progress, enteredWorld: true }, XP.enter, 'Entered the world', events), events);
      }
    },

    openPanel(panel) {
      set({ panel });
    },

    closePanel() {
      const was = get().panel;
      set({ panel: null });
      if (was?.kind === 'boss') audio.music('ambient');
    },

    interact(target) {
      const { progress } = get();
      const a = target.action;
      sound('interact');
      switch (a.kind) {
        case 'npc':
          set({ panel: { kind: 'dialogue', id: npcDialogue(a.id, progress) } });
          return;
        case 'project': {
          set({ panel: { kind: 'project', id: a.id } });
          trackGame('project_opened', { project: a.id });
          const viewed = addOnce(progress.viewedProjects, a.id);
          if (viewed) {
            const events: ProgressEvent[] = [];
            commit(gain({ ...progress, viewedProjects: viewed }, XP.project, 'Project inspected', events), events);
          }
          return;
        }
        case 'ai-terminal': {
          set({ panel: { kind: 'ai-terminal', id: a.id } });
          const seen = addOnce(progress.inspectedTerminals, a.id);
          if (seen) {
            const events: ProgressEvent[] = [];
            commit(gain({ ...progress, inspectedTerminals: seen }, XP.terminal, 'Terminal inspected', events), events);
          }
          return;
        }
        case 'trophy': {
          set({ panel: { kind: 'trophy', id: a.id } });
          const seen = addOnce(progress.viewedTrophies, a.id);
          if (seen) {
            const events: ProgressEvent[] = [];
            commit(gain({ ...progress, viewedTrophies: seen }, XP.trophy, 'Trophy inspected', events), events);
          }
          return;
        }
        case 'info': {
          set({ panel: { kind: 'info', id: a.id } });
          const egg = INFO[a.id]?.egg;
          if (a.id === 'coffee') {
            set({ coffeeUntil: Date.now() + 60_000 });
            worldEffects.emit({ kind: 'coffee' });
          }
          if (egg) get().findEgg(egg);
          return;
        }
        case 'panel':
          set({ panel: { kind: a.panel } });
          if (a.panel === 'recruiter') trackGame('recruiter_mode_opened', { from: 'kiosk' });
          return;
        case 'secret-wall': {
          if (progress.secretUnlocked) return;
          const knocks = get().wallKnocks + 1;
          set({ wallKnocks: knocks });
          if (knocks === 1) {
            toast({ kind: 'note', title: 'The wall sounds hollow…', detail: 'Maybe knock again?' });
            return;
          }
          sound('unlock');
          worldEffects.emit({ kind: 'secret-opened' });
          toast({ kind: 'note', title: 'The wall crumbles', detail: 'A hidden passage leads north.' });
          commit({ ...progress, secretUnlocked: true });
          return;
        }
      }
    },

    dialogueEnded(id) {
      const d = DIALOGUES[id];
      if ('onEnd' in d && d.onEnd === 'intro-done' && !get().progress.introDone) {
        commit({ ...get().progress, introDone: true });
      }
    },

    dialogueAction(action) {
      switch (action) {
        case 'close':
          set({ panel: null });
          return;
        case 'open-quests':
          set({ panel: { kind: 'quests' } });
          return;
        case 'start-dsa':
          trackGame('dsa_started');
          set({ panel: { kind: 'dsa' } });
          return;
        case 'start-interview':
          trackGame('interview_started');
          set({ panel: { kind: 'interview' } });
          return;
        case 'start-boss':
          audio.music('boss');
          set({ panel: { kind: 'boss' } });
          return;
        case 'start-startup':
          set({ panel: { kind: 'startup' } });
          return;
        case 'open-ending':
          set({ panel: { kind: 'ending' } });
          return;
      }
    },

    setArea(area) {
      if (get().area === area) return;
      set({ area });
      if (area === 'ai-lab') trackGame('ai_lab_entered', undefined, { once: true });
      if (area === 'secret') get().findEgg('secret-room');
    },

    setNearby(nearby) {
      const cur = get().nearby;
      if (cur?.id === nearby?.id) return;
      set({ nearby });
    },

    answerDsa(questionId, correct) {
      sound(correct ? 'hit' : 'miss');
      if (!correct) return;
      const { progress } = get();
      const solved = addOnce(progress.solvedDsa, questionId);
      if (!solved) return;
      const events: ProgressEvent[] = [];
      commit(gain({ ...progress, solvedDsa: solved }, XP.dsa, 'Accepted', events), events);
    },

    finishDsa(score) {
      trackGame('dsa_completed', { score });
      const { progress } = get();
      if (score > progress.dsaBest) commit({ ...progress, dsaBest: score });
    },

    finishInterview(score) {
      trackGame('interview_completed', { score });
      const { progress } = get();
      if (progress.interviewDone) {
        if (score > progress.interviewScore) commit({ ...progress, interviewScore: score });
        return;
      }
      const events: ProgressEvent[] = [];
      commit(
        gain({ ...progress, interviewDone: true, interviewScore: score }, XP.interview, 'Interview complete', events),
        events
      );
    },

    defeatBoss() {
      const { progress } = get();
      if (progress.bossDefeated) return;
      trackGame('game_completed');
      commit({ ...progress, bossDefeated: true });
    },

    finishStartup() {
      const { progress } = get();
      const next = { ...progress, startupRuns: progress.startupRuns + 1 };
      if (progress.startupRuns > 0) {
        commit(next);
        return;
      }
      const events: ProgressEvent[] = [];
      commit(gain(next, XP.startup, 'First startup simulated', events), events);
    },

    findEgg(egg) {
      const { progress } = get();
      const found = addOnce(progress.discoveredEasterEggs, egg);
      if (!found) return;
      const events: ProgressEvent[] = [];
      const next = gain({ ...progress, discoveredEasterEggs: found }, XP.egg, 'Easter egg', events);
      events.push({ kind: 'egg', id: egg });
      commit(next, events);
    },

    konami() {
      set({ golden: true });
      worldEffects.emit({ kind: 'konami' });
      toast({ kind: 'note', title: 'KONAMI CODE ACCEPTED', detail: '+30 lives. Lives are not a mechanic here.' });
      get().findEgg('konami');
    },

    setSound(on) {
      set((s) => ({ settings: { ...s.settings, sound: on } }));
      persist();
      if (get().entered || !on) void audio.setEnabled(on);
    },

    setReducedMotion(value) {
      set((s) => ({ settings: { ...s.settings, reducedMotion: value } }));
      persist();
    },

    resetProgress() {
      const { settings, persistence } = get();
      clearSave();
      if (persistence === 'ok') writeSave(emptyProgress(), settings);
      // The world (recruiter position, secret wall…) is built from progress; a reload is the clean reset.
      window.location.reload();
    },

    notify(title, detail) {
      toast({ kind: 'note', title, detail });
    },

    dismissToast(id) {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    },
  };
});

// Console handle for debugging and tests in development; compiled out of production builds.
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  Object.assign(window, { __SHASHI_STORE__: gameStore });
}

export function useGame<T>(selector: (s: GameState & Actions) => T): T {
  return useStore(gameStore, selector);
}

/** The user's choice wins; otherwise follow the OS. */
export function reducedMotion(): boolean {
  const pref = gameStore.getState().settings.reducedMotion;
  if (pref !== null) return pref;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
