import type { Progress } from '@/game/systems/progression';

export type AchievementId =
  | 'first-steps'
  | 'project-explorer'
  | 'ai-apprentice'
  | 'algorithm-survivor'
  | 'curious-engineer'
  | 'interview-ready'
  | 'recruiter-defeated';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  isUnlocked: (p: Progress) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-steps', title: 'First Steps', description: 'Enter the world.', isUnlocked: (p) => p.enteredWorld },
  {
    id: 'project-explorer',
    title: 'Project Explorer',
    description: 'Inspect 3 projects.',
    isUnlocked: (p) => p.viewedProjects.length >= 3,
  },
  {
    id: 'ai-apprentice',
    title: 'AI Apprentice',
    description: 'Complete the AI Lab.',
    isUnlocked: (p) => p.completedQuests.includes('ai-lab'),
  },
  {
    id: 'algorithm-survivor',
    title: 'Algorithm Survivor',
    description: 'Complete the DSA Arena.',
    isUnlocked: (p) => p.completedQuests.includes('dsa'),
  },
  {
    id: 'curious-engineer',
    title: 'Curious Engineer',
    description: 'Find 3 Easter eggs.',
    isUnlocked: (p) => p.discoveredEasterEggs.length >= 3,
  },
  {
    id: 'interview-ready',
    title: 'Interview Ready',
    description: 'Complete the interview.',
    isUnlocked: (p) => p.interviewDone,
  },
  {
    id: 'recruiter-defeated',
    title: 'Recruiter Defeated',
    description: 'Finish the final boss.',
    isUnlocked: (p) => p.bossDefeated,
  },
];
