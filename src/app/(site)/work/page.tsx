import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { WorkPageContent } from "@/components/work/work-page-content";
import { PageHeader } from "@/components/ui/section-header";
import type { ProjectData } from "@/lib/types";

export const revalidate = 60;

const description =
  "Engineering case studies and production systems — from patent-backed ML localization and AI-powered fintech platforms to quantitative finance and blockchain applications.";

export const metadata: Metadata = {
  title: "Work",
  description,
  openGraph: { title: "Work — Shashi Bhushan Vijay", description },
};

export default async function WorkPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized: ProjectData[] = projects.map((p) => ({
    ...p,
    metrics: p.metrics as Record<string, string> | null,
  }));

  return (
    <>
      <PageHeader
        path="work"
        title="Engineering work"
        description="Case studies from patent-backed ML systems and AI platforms to quantitative finance and blockchain applications."
        meta={`${projects.length} case studies`}
      />
      <WorkPageContent projects={serialized} />
    </>
  );
}
