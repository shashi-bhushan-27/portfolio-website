import { prisma } from "@/lib/prisma";
import { getPublishedArticles } from "@/lib/articles";
import { Hero } from "@/components/home/hero";
import {
  Changelog,
  ContactBlock,
  LatestWriting,
  Now,
  SelectedWork,
} from "@/components/home/sections";
import type { ProjectData, MilestoneData } from "@/lib/types";

export const revalidate = 60;

export default async function Home() {
  const [featuredProjects, milestones, articles] = await Promise.all([
    prisma.project.findMany({
      where: { featured: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.milestone.findMany({
      orderBy: { createdAt: "asc" },
    }),
    getPublishedArticles(4),
  ]);

  const projects: ProjectData[] = featuredProjects.map((p) => ({
    ...p,
    metrics: p.metrics as Record<string, string> | null,
  }));

  const timeline: MilestoneData[] = milestones.map((m) => ({
    id: m.id,
    year: m.year,
    title: m.title,
    description: m.description,
  }));

  return (
    <>
      <Hero />
      <SelectedWork projects={projects} />
      <LatestWriting articles={articles} />
      <Now />
      <Changelog milestones={timeline} />
      <ContactBlock />
    </>
  );
}
