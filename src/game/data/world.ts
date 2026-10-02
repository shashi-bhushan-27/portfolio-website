import type { FloorStyle, NpcSprite, ObjectSprite, WallStyle } from '@/game/config/tiles';

/**
 * The map, as data. Rooms and corridors are floor rectangles (in tiles); walls are
 * generated around them by systems/world-builder.ts. Coordinates are tile x/y.
 */

export const WORLD_SIZE = { cols: 57, rows: 43 } as const;

export type AreaId =
  | 'hub'
  | 'ai-lab'
  | 'garage'
  | 'trophy'
  | 'dsa'
  | 'startup'
  | 'interview'
  | 'secret';

export type Rect = { x: number; y: number; w: number; h: number };

export type Area = {
  id: AreaId;
  name: string;
  blurb: string;
  rect: Rect;
  floor: FloorStyle;
  wall: WallStyle;
};

export const AREAS: Area[] = [
  {
    id: 'ai-lab',
    name: 'AI Lab',
    blurb: 'LLMs · RAG · OCR · ML',
    rect: { x: 20, y: 3, w: 18, h: 9 },
    floor: 'lab',
    wall: 'lab',
  },
  {
    id: 'hub',
    name: 'Central Hub',
    blurb: 'Start here',
    rect: { x: 21, y: 16, w: 16, h: 11 },
    floor: 'hub',
    wall: 'brick',
  },
  {
    id: 'garage',
    name: 'Project Garage',
    blurb: 'Everything I have shipped',
    rect: { x: 2, y: 15, w: 15, h: 12 },
    floor: 'garage',
    wall: 'garage',
  },
  {
    id: 'trophy',
    name: 'Trophy Room',
    blurb: 'Patent application · hackathons · research',
    rect: { x: 41, y: 16, w: 14, h: 10 },
    floor: 'wood',
    wall: 'wood',
  },
  {
    id: 'dsa',
    name: 'DSA Arena',
    blurb: 'Five problems. No IDE.',
    rect: { x: 3, y: 31, w: 14, h: 10 },
    floor: 'arena',
    wall: 'arena',
  },
  {
    id: 'startup',
    name: 'Startup Garage',
    blurb: '₹10,00,000 and a dream',
    rect: { x: 22, y: 32, w: 14, h: 9 },
    floor: 'startup',
    wall: 'brick',
  },
  {
    id: 'interview',
    name: 'Interview Room',
    blurb: 'Real questions only',
    rect: { x: 41, y: 32, w: 13, h: 9 },
    floor: 'interview',
    wall: 'wood',
  },
  {
    id: 'secret',
    name: 'Secret Developer Room',
    blurb: 'You weren’t supposed to find this',
    rect: { x: 3, y: 4, w: 9, h: 7 },
    floor: 'secret',
    wall: 'secret',
  },
];

export const CORRIDORS: Rect[] = [
  { x: 28, y: 12, w: 2, h: 4 }, // AI Lab ↔ Hub
  { x: 17, y: 20, w: 4, h: 2 }, // Garage ↔ Hub
  { x: 37, y: 20, w: 4, h: 2 }, // Hub ↔ Trophy Room
  { x: 28, y: 27, w: 2, h: 5 }, // Hub ↔ Startup Garage
  { x: 17, y: 35, w: 5, h: 2 }, // DSA Arena ↔ Startup Garage
  { x: 36, y: 35, w: 5, h: 2 }, // Startup Garage ↔ Interview Room
  { x: 6, y: 11, w: 2, h: 4 }, // Secret room ↔ Garage (sealed by the cracked wall)
];

/** Rug in the middle of the hub. */
export const RUG: Rect = { x: 27, y: 21, w: 4, h: 3 };

/** The garage's north wall hides the way to the secret room until it's knocked through. */
export const SECRET_WALL = [
  { x: 6, y: 14 },
  { x: 7, y: 14 },
];

export const SPAWN = { x: 28, y: 23 };

/** What happens when the player interacts with something. */
export type Interaction =
  | { kind: 'npc'; id: NpcId }
  | { kind: 'project'; id: string }
  | { kind: 'ai-terminal'; id: string }
  | { kind: 'trophy'; id: string }
  | { kind: 'info'; id: string }
  | { kind: 'panel'; panel: 'quests' | 'recruiter' | 'terminal' }
  | { kind: 'secret-wall' };

export type WorldObject = {
  sprite: ObjectSprite;
  x: number;
  y: number;
  /** Interactive objects have an id, a prompt label and an action. */
  id?: string;
  label?: string;
  action?: Interaction;
};

const decor = (sprite: ObjectSprite, x: number, y: number): WorldObject => ({ sprite, x, y });

const machine = (id: string, label: string, x: number, y: number, sprite: ObjectSprite = 'machine'): WorldObject => ({
  id: `machine-${id}`,
  sprite,
  x,
  y,
  label,
  action: { kind: 'project', id },
});

export const OBJECTS: WorldObject[] = [
  // ── AI Lab ──
  { id: 'terminal-llm', sprite: 'terminalLime', x: 22, y: 4, label: 'LLM terminal', action: { kind: 'ai-terminal', id: 'llm' } },
  { id: 'terminal-rag', sprite: 'terminalCyan', x: 26, y: 4, label: 'RAG system', action: { kind: 'ai-terminal', id: 'rag' } },
  { id: 'terminal-ocr', sprite: 'terminalOrange', x: 31, y: 4, label: 'OCR machine', action: { kind: 'ai-terminal', id: 'ocr' } },
  { id: 'terminal-ml', sprite: 'terminalPurple', x: 35, y: 4, label: 'ML terminal', action: { kind: 'ai-terminal', id: 'ml' } },
  decor('serverRack', 20, 3),
  decor('serverRack', 20, 4),
  decor('serverRack', 37, 3),
  decor('serverRack', 37, 4),
  decor('bigScreen', 28, 3),
  decor('bigScreen', 29, 3),
  decor('plant', 20, 11),
  decor('plant', 37, 11),
  decor('whiteboard', 33, 9),

  // ── Central Hub ──
  { id: 'quest-board', sprite: 'questBoard', x: 24, y: 16, label: 'Quest board', action: { kind: 'panel', panel: 'quests' } },
  { id: 'kiosk', sprite: 'terminalLime', x: 33, y: 16, label: 'Recruiter mode kiosk', action: { kind: 'panel', panel: 'recruiter' } },
  { id: 'coffee', sprite: 'coffee', x: 35, y: 16, label: 'Coffee machine', action: { kind: 'info', id: 'coffee' } },
  { id: 'welcome-sign', sprite: 'sign', x: 26, y: 25, label: 'Sign', action: { kind: 'info', id: 'welcome' } },
  decor('waterCooler', 36, 16),
  decor('plant', 21, 16),
  decor('plant', 21, 26),
  decor('plant', 36, 26),
  decor('sofa', 22, 23),
  decor('sofa', 22, 24),

  // ── Project Garage: one machine per project ──
  machine('indoor-positioning-system', 'Indoor Positioning System', 3, 18, 'floorPlan'),
  machine('proofstack', 'ProofStack', 6, 18),
  machine('trade-document-intelligence', 'Trade Document Intelligence', 9, 18, 'machineAlt'),
  machine('lendloop', 'LendLoop', 12, 18),
  machine('automl-assistant', 'AutoML Assistant', 15, 18, 'machineAlt'),
  machine('oncofollow-symptom-triage', 'OncoFollow', 3, 23),
  machine('flex-dca-ai-platform', 'FLEX-DCA', 6, 23, 'machineAlt'),
  machine('rag-document-qa', 'RAG Document Q&A', 9, 23),
  machine('quantfinance-platform', 'quantFinance', 12, 23, 'machineAlt'),
  machine('blockchain-crowdfunding', 'Blockchain Crowdfunding', 15, 23),
  decor('crate', 2, 26),
  decor('crate', 16, 26),
  decor('bookshelf', 11, 15),
  decor('bookshelf', 12, 15),

  // ── Trophy Room ──
  { id: 'trophy-patent', sprite: 'trophyGold', x: 43, y: 17, label: 'Patent application', action: { kind: 'trophy', id: 'patent' } },
  { id: 'trophy-arc', sprite: 'trophyGold', x: 46, y: 17, label: 'ARC Hackathon', action: { kind: 'trophy', id: 'arc-hackathon' } },
  { id: 'trophy-convolve', sprite: 'trophySilver', x: 49, y: 17, label: 'Convolve 4.0', action: { kind: 'trophy', id: 'convolve' } },
  { id: 'trophy-iste', sprite: 'plaque', x: 52, y: 17, label: 'ISTE sponsorships', action: { kind: 'trophy', id: 'iste' } },
  { id: 'trophy-research', sprite: 'plaque', x: 45, y: 21, label: 'Research results', action: { kind: 'trophy', id: 'research' } },
  { id: 'trophy-certs', sprite: 'certificates', x: 50, y: 21, label: 'Certifications', action: { kind: 'trophy', id: 'certifications' } },
  decor('banner', 41, 16),
  decor('banner', 54, 16),
  decor('plant', 41, 25),
  decor('plant', 54, 25),

  // ── DSA Arena ──
  { id: 'duck', sprite: 'duck', x: 14, y: 38, label: 'Rubber duck', action: { kind: 'info', id: 'duck' } },
  decor('pillar', 4, 32),
  decor('pillar', 15, 32),
  decor('pillar', 4, 39),
  decor('pillar', 15, 39),
  decor('banner', 8, 31),
  decor('banner', 11, 31),

  // ── Startup Garage ──
  { id: 'pitch-board', sprite: 'whiteboard', x: 25, y: 32, label: 'Pitch board', action: { kind: 'info', id: 'pitch-board' } },
  decor('deskComputer', 32, 33),
  decor('chair', 32, 34),
  decor('sofa', 23, 38),
  decor('sofa', 24, 38),
  decor('pingPong', 32, 38),
  decor('pingPong', 33, 38),
  decor('crate', 22, 40),
  decor('crate', 35, 40),

  // ── Interview Room: talking across the desk reaches the recruiter ──
  { id: 'interview-desk', sprite: 'desk', x: 46, y: 35, label: 'Talk to the Recruiter', action: { kind: 'npc', id: 'recruiter' } },
  { id: 'interview-computer', sprite: 'deskComputer', x: 47, y: 35, label: 'Talk to the Recruiter', action: { kind: 'npc', id: 'recruiter' } },
  decor('bookshelf', 41, 32),
  decor('bookshelf', 42, 32),
  decor('whiteboard', 50, 32),
  decor('plant', 53, 32),
  decor('waterCooler', 53, 40),
  decor('plant', 41, 40),

  // ── Secret Developer Room ──
  { id: 'learning-board', sprite: 'learningBoard', x: 7, y: 4, label: 'What I’m learning', action: { kind: 'info', id: 'learning' } },
  { id: 'old-terminal', sprite: 'oldTerminal', x: 11, y: 7, label: 'Old terminal', action: { kind: 'panel', panel: 'terminal' } },
  decor('bookshelf', 3, 4),
  decor('bookshelf', 4, 4),
  decor('lavaLamp', 10, 4),
  decor('crate', 3, 10),
];

export type NpcId = 'recruiter' | 'keeper' | 'founder' | 'lab-bot';

export type WorldNpc = {
  id: NpcId;
  sprite: NpcSprite;
  name: string;
  x: number;
  y: number;
};

export const NPCS: WorldNpc[] = [
  { id: 'recruiter', sprite: 'recruiter', name: 'Recruiter', x: 28, y: 19 },
  { id: 'keeper', sprite: 'keeper', name: 'Arena Keeper', x: 10, y: 33 },
  { id: 'founder', sprite: 'founder', name: 'Founder', x: 28, y: 34 },
  { id: 'lab-bot', sprite: 'labBot', name: 'Lab Bot', x: 29, y: 7 },
];

/** Where the recruiter waits once the intro is done: behind the interview desk. */
export const RECRUITER_INTERVIEW_SPOT = { x: 46, y: 34 };
