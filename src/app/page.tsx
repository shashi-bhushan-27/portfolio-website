import { prisma } from "@/lib/prisma";
import { HomeContent } from "@/components/home/home-content";
import type { ProjectData, MilestoneData } from "@/lib/types";

export default async function Home() {
  const [featuredProjects, milestones] = await Promise.all([
    prisma.project.findMany({
      where: { featured: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.milestone.findMany({
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Serialize for client component boundary
  const serializedProjects: ProjectData[] = featuredProjects.map((p) => ({
    ...p,
    metrics: p.metrics as Record<string, string> | null,
  }));

  const serializedMilestones: MilestoneData[] = milestones.map((m) => ({
    id: m.id,
    year: m.year,
    title: m.title,
    description: m.description,
  }));

  return (
    <HomeContent
      featuredProjects={serializedProjects}
      milestones={serializedMilestones}
    />
  );
}
