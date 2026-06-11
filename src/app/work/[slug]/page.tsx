import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CaseStudyContent } from "@/components/work/case-study-content";
import type { ProjectData } from "@/lib/types";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const projects = await prisma.project.findMany({
    select: { slug: true },
  });
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { title: true, excerpt: true },
  });

  if (!project) {
    return {
      title: "Project Not Found — Shashi Bhushan Vijay",
    };
  }

  return {
    title: `${project.title} — Shashi Bhushan Vijay`,
    description: project.excerpt,
    openGraph: {
      title: `${project.title} — Shashi Bhushan Vijay`,
      description: project.excerpt,
    },
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
  });

  if (!project) {
    notFound();
  }

  const serialized: ProjectData = {
    ...project,
    metrics: project.metrics as Record<string, string> | null,
  };

  return <CaseStudyContent project={serialized} />;
}
