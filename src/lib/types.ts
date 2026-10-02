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
  status: PublishStatus;
  order: number;
  updatedAt: string; // ISO string
};

export type PublishStatus = 'DRAFT' | 'PUBLISHED';

/** A project row as the admin Work list needs it. */
export type AdminProject = Pick<
  ProjectData,
  'id' | 'slug' | 'title' | 'domain' | 'year' | 'featured' | 'status' | 'order' | 'updatedAt'
>;

export type MilestoneData = {
  id: string;
  year: string;
  title: string;
  description: string;
};

export type ArticleStatus = 'DRAFT' | 'PUBLISHED';

export type ArticleData = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string | null;
  category: string;
  readingTime: number;
  publishedAt: string; // ISO string — serialized from Date
  updatedAt: string; // ISO string
  tags: string[];
  featured: boolean;
  status: ArticleStatus;
  coverImage: string | null;
};

/** Listing-sized article (no markdown body). */
export type ArticleSummary = Omit<ArticleData, 'content'>;

export type TocItem = {
  id: string;
  text: string;
  depth: 2 | 3;
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

/** A résumé as the admin Résumés screen needs it (no file bytes). */
export type AdminResume = {
  id: string;
  label: string;
  fileName: string;
  size: number;
  active: boolean;
  createdAt: string; // ISO string
};

/** A video as the admin Videos screen needs it (no dates). */
export type AdminVideo = {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  category: string;
  featured: boolean;
  order: number;
};

export type VideoData = {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  category: string;
  featured: boolean;
  order: number;
  publishedAt: string; // ISO string — serialized from Date
};
