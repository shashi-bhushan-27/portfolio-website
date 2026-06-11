/**
 * Shared types for database entities.
 * These mirror the Prisma models but are plain serializable types
 * safe for passing from Server Components to Client Components.
 */

export type ProjectData = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  domain: string;
  technologies: string[];
  featured: boolean;
  year: string;
  metrics: Record<string, string> | null;
  githubUrl: string | null;
  liveUrl: string | null;
  coverGradient: string;
  icon: string;
  executiveSummary: string;
  problemStatement: string;
  systemArchitecture: string;
  technologyDecisions: string;
  engineeringTradeoffs: string;
  challengesFaced: string;
  solutionsImplemented: string;
  performanceMetrics: string;
  lessonsLearned: string;
  futureImprovements: string;
};

export type MilestoneData = {
  id: string;
  year: string;
  title: string;
  description: string;
};

export type ArticleData = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string | null;
  category: string;
  readingTime: number;
  publishedAt: string; // ISO string — serialized from Date
  tags: string[];
  featured: boolean;
};

export type SystemArchitectureNode = {
  id: string;
  label: string;
  tech: string;
  x: number;
  y: number;
  color: string;
};

export type SystemArchitectureEdge = {
  from: string;
  to: string;
  label?: string;
};

export type SystemArchitectureData = {
  id: string;
  architectureId: string;
  title: string;
  description: string;
  nodes: SystemArchitectureNode[];
  edges: SystemArchitectureEdge[];
};
