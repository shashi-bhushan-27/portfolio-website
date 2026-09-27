import { prisma } from "@/lib/prisma";
import { getPublishedArticles } from "@/lib/articles";
import { getPublishedProjects } from "@/lib/projects";
import { Hero } from "@/components/home/hero";
import {
  Changelog,
  ContactBlock,
  LatestWriting,
  Now,
  SelectedWork,
} from "@/components/home/sections";
import type { MilestoneData } from "@/lib/types";

export const revalidate = 60;

export default async function Home() {
  const [projects, milestones, articles] = await Promise.all([
    getPublishedProjects({ featured: true }),
    prisma.milestone.findMany({
      orderBy: { createdAt: "asc" },
    }),
    getPublishedArticles(4),
  ]);

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
