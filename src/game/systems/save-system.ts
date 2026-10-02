import { ACHIEVEMENTS } from '@/game/data/achievements';
import { QUESTS } from '@/game/data/quests';
import { emptyProgress, type EggId, type Progress } from '@/game/systems/progression';

export const SAVE_KEY = 'shashi-rpg-save-v1';
const VERSION = 1;

export type Settings = {
  sound: boolean;
  /** null follows the OS prefers-reduced-motion setting. */
  reducedMotion: boolean | null;
};

export const defaultSettings = (): Settings => ({ sound: false, reducedMotion: null });

export type SaveData = { version: number; progress: Progress; settings: Settings };

export type LoadResult =
  | { status: 'ok' | 'empty'; data: SaveData }
  | { status: 'reset'; data: SaveData } // the stored save was unreadable and has been cleared
  | { status: 'unavailable'; data: SaveData }; // storage is blocked; play without saving

const EGGS: EggId[] = ['coffee', 'secret-room', 'sudo-hire', 'konami', 'rubber-duck'];

const fresh = (): SaveData => ({ version: VERSION, progress: emptyProgress(), settings: defaultSettings() });

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Keeps only known string ids, deduplicated. */
const ids = <T extends string>(v: unknown, allowed?: readonly T[]): T[] =>
  Array.isArray(v)
    ? [...new Set(v.filter((x): x is T => typeof x === 'string' && x.length < 120 && (!allowed || allowed.includes(x as T))))]
    : [];

const count = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(Math.max(0, Math.floor(v)), max) : 0);
const flag = (v: unknown) => v === true;

/** Rebuilds a Progress from untrusted JSON, field by field. Throws only if the shape is unusable. */
export function sanitize(raw: unknown): SaveData {
  if (!isRecord(raw) || raw.version !== VERSION || !isRecord(raw.progress)) throw new Error('unrecognised save');
  const p = raw.progress;
  const s = isRecord(raw.settings) ? raw.settings : {};
  return {
    version: VERSION,
    progress: {
      xp: count(p.xp, 100_000),
      enteredWorld: flag(p.enteredWorld),
      introDone: flag(p.introDone),
      secretUnlocked: flag(p.secretUnlocked),
      completedQuests: ids(p.completedQuests, QUESTS.map((q) => q.id)),
      achievements: ids(p.achievements, ACHIEVEMENTS.map((a) => a.id)),
      discoveredEasterEggs: ids(p.discoveredEasterEggs, EGGS),
      viewedProjects: ids(p.viewedProjects),
      inspectedTerminals: ids(p.inspectedTerminals),
      viewedTrophies: ids(p.viewedTrophies),
      solvedDsa: ids(p.solvedDsa),
      dsaBest: count(p.dsaBest, 5),
      interviewDone: flag(p.interviewDone),
      interviewScore: count(p.interviewScore, 10),
      bossDefeated: flag(p.bossDefeated),
      startupRuns: count(p.startupRuns, 10_000),
    },
    settings: {
      sound: flag(s.sound),
      reducedMotion: typeof s.reducedMotion === 'boolean' ? s.reducedMotion : null,
    },
  };
}

function storage(): Storage | null {
  try {
    const ls = window.localStorage;
    const probe = `${SAVE_KEY}:probe`;
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

export function loadSave(): LoadResult {
  const ls = storage();
  if (!ls) return { status: 'unavailable', data: fresh() };
  let text: string | null;
  try {
    text = ls.getItem(SAVE_KEY);
  } catch {
    return { status: 'unavailable', data: fresh() };
  }
  if (!text) return { status: 'empty', data: fresh() };
  try {
    return { status: 'ok', data: sanitize(JSON.parse(text)) };
  } catch {
    try {
      ls.removeItem(SAVE_KEY);
    } catch {
      // Nothing more to do; the next save overwrites it.
    }
    return { status: 'reset', data: fresh() };
  }
}

/** Returns false when the write failed (quota, private mode…); the game keeps running. */
export function writeSave(progress: Progress, settings: Settings): boolean {
  try {
    const data: SaveData = { version: VERSION, progress, settings };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage blocked: there is nothing to clear.
  }
}
