import { ACHIEVEMENTS, type AchievementId } from '@/game/data/achievements';
import { QUESTS, type QuestId } from '@/game/data/quests';

export type EggId = 'coffee' | 'secret-room' | 'sudo-hire' | 'konami' | 'rubber-duck';
export const EGG_COUNT = 5;

/** Everything that survives a reload. */
export type Progress = {
  xp: number;
  enteredWorld: boolean;
  introDone: boolean;
  secretUnlocked: boolean;
  completedQuests: QuestId[];
  achievements: AchievementId[];
  discoveredEasterEggs: EggId[];
  viewedProjects: string[];
  inspectedTerminals: string[];
  viewedTrophies: string[];
  /** DSA questions answered correctly at least once (XP is paid once per question). */
  solvedDsa: string[];
  dsaBest: number;
  interviewDone: boolean;
  interviewScore: number;
  bossDefeated: boolean;
  startupRuns: number;
};

export const emptyProgress = (): Progress => ({
  xp: 0,
  enteredWorld: false,
  introDone: false,
  secretUnlocked: false,
  completedQuests: [],
  achievements: [],
  discoveredEasterEggs: [],
  viewedProjects: [],
  inspectedTerminals: [],
  viewedTrophies: [],
  solvedDsa: [],
  dsaBest: 0,
  interviewDone: false,
  interviewScore: 0,
  bossDefeated: false,
  startupRuns: 0,
});

export const XP = {
  enter: 10,
  project: 25,
  terminal: 25,
  trophy: 10,
  dsa: 50,
  egg: 25,
  interview: 100,
  startup: 50,
} as const;

/** XP needed to reach each level; the last entry is the cap. */
export const LEVELS = [0, 250, 600, 1100, 1700] as const;

export function levelFor(xp: number) {
  let level = 1;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]) level = i + 1;
  const floor = LEVELS[level - 1];
  const next = LEVELS[level] ?? null;
  return { level, floor, next, max: next === null };
}

export type ProgressEvent =
  | { kind: 'xp'; amount: number; reason: string }
  | { kind: 'quest'; id: QuestId }
  | { kind: 'achievement'; id: AchievementId }
  | { kind: 'egg'; id: EggId }
  | { kind: 'level'; level: number };

/**
 * Applies XP, then completes any quests and achievements whose conditions now hold
 * (quest rewards can unlock more). Pure: returns the new progress and what happened.
 */
export function settle(before: Progress, after: Progress, events: ProgressEvent[] = []) {
  const p = { ...after };
  const out = [...events];

  for (let changed = true; changed; ) {
    changed = false;
    for (const q of QUESTS) {
      if (p.completedQuests.includes(q.id)) continue;
      if (q.required?.some((r) => !p.completedQuests.includes(r))) continue;
      const [have, need] = q.progress(p);
      if (have < need) continue;
      p.completedQuests = [...p.completedQuests, q.id];
      p.xp += q.rewardXP;
      out.push({ kind: 'quest', id: q.id });
      changed = true;
    }
    for (const a of ACHIEVEMENTS) {
      if (p.achievements.includes(a.id) || !a.isUnlocked(p)) continue;
      p.achievements = [...p.achievements, a.id];
      out.push({ kind: 'achievement', id: a.id });
      changed = true;
    }
  }

  const from = levelFor(before.xp).level;
  const to = levelFor(p.xp).level;
  if (to > from) out.push({ kind: 'level', level: to });
  return { progress: p, events: out };
}

/** Adds an id to a list once; returns null when it was already there. */
export const addOnce = <T extends string>(list: T[], id: T): T[] | null => (list.includes(id) ? null : [...list, id]);
