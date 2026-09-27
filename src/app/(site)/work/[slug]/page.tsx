import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PROJECT_ORDER, getPublishedProject } from "@/lib/projects";
import { CaseStudyContent } from "@/components/work/case-study-content";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const projects = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug);

  if (!project) return { title: "Project not found" };

  return {
    title: project.title,
    description: project.excerpt,
    openGraph: {
      title: `${project.title} — Shashi Bhushan Vijay`,
      description: project.excerpt,
    },
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const [project, all] = await Promise.all([
    getPublishedProject(slug),
    prisma.project.findMany({
      where: { status: "PUBLISHED" },
      orderBy: PROJECT_ORDER,
      select: { slug: true, title: true },
    }),
  ]);

  if (!project) notFound();

  const i = all.findIndex((p) => p.slug === slug);
  const next = all.length > 1 ? all[(i + 1) % all.length] : null;

  return <CaseStudyContent project={project} next={next} />;
}
