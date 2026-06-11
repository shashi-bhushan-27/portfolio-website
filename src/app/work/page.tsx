import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { WorkPageContent } from "@/components/work/work-page-content";
import type { ProjectData } from "@/lib/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Work — Shashi Bhushan Vijay",
  description:
    "Engineering case studies and production systems — from patent-backed ML localization and AI-powered fintech platforms to quantitative finance and blockchain applications.",
  openGraph: {
    title: "Work — Shashi Bhushan Vijay",
    description:
      "Engineering case studies and production systems — from patent-backed ML localization and AI-powered fintech platforms to quantitative finance and blockchain applications.",
  },
};

export default async function WorkPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized: ProjectData[] = projects.map((p) => ({
    ...p,
    metrics: p.metrics as Record<string, string> | null,
  }));

  return <WorkPageContent projects={serialized} />;
}
