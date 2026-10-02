import type { AreaId } from '@/game/data/world';
import type { Progress } from '@/game/systems/progression';

export type QuestId = 'ai-lab' | 'projects' | 'dsa' | 'interview' | 'boss';

export interface Quest {
  id: QuestId;
  title: string;
  description: string;
  rewardXP: number;
  required?: QuestId[];
  /** Where to go next — shown in the quest tracker. */
  where: AreaId;
  /** [have, need] */
  progress: (p: Progress) => [number, number];
}

export const AI_TERMINAL_IDS = ['llm', 'rag', 'ocr', 'ml'] as const;

export const QUESTS: Quest[] = [
  {
    id: 'ai-lab',
    title: 'Explore the AI Lab',
    description: 'Inspect all four terminals in the AI Lab, north of the hub.',
    rewardXP: 100,
    where: 'ai-lab',
    progress: (p) => [AI_TERMINAL_IDS.filter((t) => p.inspectedTerminals.includes(t)).length, AI_TERMINAL_IDS.length],
  },
  {
    id: 'projects',
    title: 'Inspect 3 projects',
    description: 'Inspect any three machines in the Project Garage, west of the hub.',
    rewardXP: 150,
    where: 'garage',
    progress: (p) => [Math.min(p.viewedProjects.length, 3), 3],
  },
  {
    id: 'dsa',
    title: 'Complete the DSA Challenge',
    description: 'Score at least 3 out of 5 in the DSA Arena, south-west.',
    rewardXP: 150,
    where: 'dsa',
    progress: (p) => [Math.min(p.dsaBest, 3), 3],
  },
  {
    id: 'interview',
    title: 'Enter the Interview Room',
    description: 'Sit the interview with the Recruiter, south-east.',
    rewardXP: 200,
    where: 'interview',
    progress: (p) => [p.interviewDone ? 1 : 0, 1],
  },
  {
    id: 'boss',
    title: 'Defeat the Recruiter',
    description: 'Win the final round in the Interview Room.',
    rewardXP: 300,
    required: ['interview'],
    where: 'interview',
    progress: (p) => [p.bossDefeated ? 1 : 0, 1],
  },
];
