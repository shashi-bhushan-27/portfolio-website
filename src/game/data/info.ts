import { topics } from '@/lib/content';
import type { EggId } from '@/game/systems/progression';

/** Short read-only boards: signs, Easter eggs, the secret room. */
export type InfoBoard = {
  kicker: string;
  title: string;
  lines: string[];
  list?: { label: string; detail?: string }[];
  /** Finding this counts as an Easter egg. */
  egg?: EggId;
};

const learning = topics.filter((t) => t.status === 'Active' || t.status === 'Exploring');

export const INFO: Record<string, InfoBoard> = {
  welcome: {
    kicker: 'Sign',
    title: 'Welcome to SHASHI.EXE',
    lines: [
      'A small, playable version of my portfolio. Every project, number and trophy in here is real — and all of it is on the regular site too.',
      'In a hurry? The kiosk by the coffee machine has a one-page Recruiter mode.',
    ],
  },
  coffee: {
    kicker: 'Coffee machine',
    title: 'COFFEE DETECTED',
    lines: ['Developer productivity: +17%', 'Walking speed: +17% for the next minute.'],
    egg: 'coffee',
  },
  duck: {
    kicker: 'Rubber duck',
    title: 'Rubber duck debugging session',
    lines: [
      'You explain the bug to the duck, line by line.',
      'The duck says nothing.',
      'You find the bug anyway.',
    ],
    egg: 'rubber-duck',
  },
  'pitch-board': {
    kicker: 'Pitch board',
    title: 'Napkin maths',
    lines: [
      'CAC, LTV, churn, burn, runway — scribbled and crossed out several times.',
      'Talk to the Founder to run a year of your own startup.',
    ],
  },
  learning: {
    kicker: 'Secret Developer Room',
    title: 'Things I’m currently learning',
    lines: ['The list on the board, straight from the research log on /exploring:'],
    list: learning.map((t) => ({ label: t.title, detail: t.description })),
  },
};
