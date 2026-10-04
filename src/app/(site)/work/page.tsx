import type { Metadata } from "next";
import { getPublishedProjects } from "@/lib/projects";
import { WorkPageContent } from "@/components/work/work-page-content";
import { PageHeader } from "@/components/ui/section-header";

export const revalidate = 60;

const description =
  "Engineering case studies and production systems — from LLM and document-intelligence platforms to ML localization with a published patent and full-stack products.";

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
        description="Case studies from LLM and AI platforms to ML systems with a published patent and full-stack products."
        meta={`${projects.length} case studies`}
      />
      <WorkPageContent projects={projects} />
    </>
  );
}
