import type { NpcSprite } from '@/game/config/tiles';
import type { NpcId } from '@/game/data/world';
import type { Progress } from '@/game/systems/progression';

export type DialogueAction =
  | 'close'
  | 'open-quests'
  | 'start-dsa'
  | 'start-interview'
  | 'start-boss'
  | 'start-startup'
  | 'open-ending';

export type Dialogue = {
  speaker: string;
  portrait: NpcSprite;
  lines: string[];
  choices?: { label: string; action: DialogueAction }[];
  /** Side effect once the last line is read. */
  onEnd?: 'intro-done';
};

export const DIALOGUES = {
  'recruiter-intro': {
    speaker: 'Recruiter',
    portrait: 'recruiter',
    lines: [
      'So you’re Shashi?',
      'People tell me you build things.',
      'Let’s see what you’ve been working on.',
      'The AI Lab is north. The Project Garage is west, the Trophy Room east. The DSA Arena and the Startup Garage are south.',
      'When you’re ready, find me in the Interview Room — south-east.',
    ],
    choices: [
      { label: 'Open quest log', action: 'open-quests' },
      { label: 'Let’s go', action: 'close' },
    ],
    onEnd: 'intro-done',
  },
  'recruiter-early': {
    speaker: 'Recruiter',
    portrait: 'recruiter',
    lines: ['You came straight here? Bold.', 'Most candidates look around first — the AI Lab and the Garage are worth the walk.'],
    choices: [
      { label: 'Start the interview anyway', action: 'start-interview' },
      { label: 'I’ll explore first', action: 'close' },
    ],
  },
  'recruiter-interview': {
    speaker: 'Recruiter',
    portrait: 'recruiter',
    lines: ['Have a seat.', 'Four questions. Real ones — no trick puzzles.'],
    choices: [
      { label: 'Start the interview', action: 'start-interview' },
      { label: 'Not yet', action: 'close' },
    ],
  },
  'recruiter-boss': {
    speaker: 'Recruiter',
    portrait: 'recruiter',
    lines: [
      'Not bad.',
      'But there’s one more round, and I’m the one who signs off.',
      'Harder questions. You can stumble three times.',
    ],
    choices: [
      { label: 'Bring it on', action: 'start-boss' },
      { label: 'Give me a minute', action: 'close' },
    ],
  },
  'recruiter-after': {
    speaker: 'Recruiter',
    portrait: 'recruiter',
    lines: ['We’ll be in touch.', 'The good kind of “in touch”, for once.'],
    choices: [
      { label: 'See the summary', action: 'open-ending' },
      { label: 'Keep exploring', action: 'close' },
    ],
  },
  'keeper-intro': {
    speaker: 'Arena Keeper',
    portrait: 'keeper',
    lines: [
      'Welcome to the DSA Arena.',
      'Let’s see if you actually know DSA.',
      'Five problems. Multiple choice. No IDE, no Stack Overflow.',
    ],
    choices: [
      { label: 'Start the challenge', action: 'start-dsa' },
      { label: 'Later', action: 'close' },
    ],
  },
  'keeper-done': {
    speaker: 'Arena Keeper',
    portrait: 'keeper',
    lines: ['You’ve already survived the arena.', 'Another round? The problems don’t get easier. You might.'],
    choices: [
      { label: 'Run it again', action: 'start-dsa' },
      { label: 'Not today', action: 'close' },
    ],
  },
  founder: {
    speaker: 'Founder',
    portrait: 'founder',
    lines: [
      'Welcome to the Startup Garage.',
      'You get ₹10,00,000 and twelve months of runway.',
      'Pick a product, a price, a channel and a team. I’ll fast-forward a year.',
    ],
    choices: [
      { label: 'Let’s build', action: 'start-startup' },
      { label: 'Maybe later', action: 'close' },
    ],
  },
  'lab-bot': {
    speaker: 'Lab Bot',
    portrait: 'labBot',
    lines: [
      'BEEP. Welcome to the AI Lab.',
      'Four terminals, four kinds of AI work: LLM applications, retrieval, document OCR and classic ML.',
      'Everything here is real. Each terminal links to the projects it came from.',
    ],
  },
  'lab-bot-done': {
    speaker: 'Lab Bot',
    portrait: 'labBot',
    lines: ['All four terminals inspected.', 'You are now 87% more likely to answer every question with “it depends”.'],
  },
} satisfies Record<string, Dialogue>;

export type DialogueId = keyof typeof DIALOGUES;

/** What an NPC says depends on how far the player has got. */
export function npcDialogue(npc: NpcId, p: Progress): DialogueId {
  switch (npc) {
    case 'recruiter':
      if (!p.introDone) return 'recruiter-intro';
      if (p.bossDefeated) return 'recruiter-after';
      if (p.interviewDone) return 'recruiter-boss';
      return p.completedQuests.length >= 2 ? 'recruiter-interview' : 'recruiter-early';
    case 'keeper':
      return p.completedQuests.includes('dsa') ? 'keeper-done' : 'keeper-intro';
    case 'founder':
      return 'founder';
    case 'lab-bot':
      return p.completedQuests.includes('ai-lab') ? 'lab-bot-done' : 'lab-bot';
  }
}
