import 'server-only';
import type { Prisma, Project } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ProjectData } from '@/lib/types';

/** The order projects are shown in everywhere: manual order first, then newest. */
export const PROJECT_ORDER: Prisma.ProjectOrderByWithRelationInput[] = [
  { order: 'asc' },
  { createdAt: 'desc' },
];

export function serializeProject(p: Project): ProjectData {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    domain: p.domain,
    technologies: p.technologies,
    featured: p.featured,
    year: p.year,
    metrics: (p.metrics as Record<string, string> | null) ?? null,
    githubUrl: p.githubUrl,
    liveUrl: p.liveUrl,
    coverGradient: p.coverGradient,
    icon: p.icon,
    executiveSummary: p.executiveSummary,
    problemStatement: p.problemStatement,
    systemArchitecture: p.systemArchitecture,
    technologyDecisions: p.technologyDecisions,
    engineeringTradeoffs: p.engineeringTradeoffs,
    challengesFaced: p.challengesFaced,
    solutionsImplemented: p.solutionsImplemented,
    performanceMetrics: p.performanceMetrics,
    lessonsLearned: p.lessonsLearned,
    futureImprovements: p.futureImprovements,
    status: p.status,
    order: p.order,
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function getPublishedProjects(opts: { featured?: boolean } = {}): Promise<ProjectData[]> {
  const rows = await prisma.project.findMany({
    where: { status: 'PUBLISHED', ...(opts.featured ? { featured: true } : {}) },
    orderBy: PROJECT_ORDER,
  });
  return rows.map(serializeProject);
}

export async function getPublishedProject(slug: string): Promise<ProjectData | null> {
  const row = await prisma.project.findFirst({ where: { slug, status: 'PUBLISHED' } });
  return row ? serializeProject(row) : null;
}
