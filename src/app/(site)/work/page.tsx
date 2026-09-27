import type { Metadata } from "next";
import { getPublishedProjects } from "@/lib/projects";
import { WorkPageContent } from "@/components/work/work-page-content";
import { PageHeader } from "@/components/ui/section-header";

export const revalidate = 60;

const description =
  "Engineering case studies and production systems — from patent-backed ML localization and AI-powered fintech platforms to quantitative finance and blockchain applications.";

export const metadata: Metadata = {
  title: "Work",
  description,
  openGraph: { title: "Work — Shashi Bhushan Vijay", description },
};

export default async function WorkPage() {
  const projects = await getPublishedProjects();

  return (
    <>
      <PageHeader
        path="work"
        title="Engineering work"
        description="Case studies from patent-backed ML systems and AI platforms to quantitative finance and blockchain applications."
        meta={`${projects.length} case studies`}
      />
      <WorkPageContent projects={projects} />
    </>
  );
}
