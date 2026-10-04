import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { SystemsContent } from '@/components/systems/systems-content';
import { PageHeader } from '@/components/ui/section-header';
import type { SystemArchitectureData } from '@/lib/types';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'AI Systems',
  description:
    'Interactive system architecture explorer showcasing engineering designs across LLM and RAG pipelines, ML, IoT, and full-stack systems.',
};

export default async function SystemsPage() {
  const architectures = await prisma.systemArchitecture.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const serialized: SystemArchitectureData[] = architectures.map((a) => ({
    id: a.id,
    architectureId: a.architectureId,
    title: a.title,
    description: a.description,
    nodes: a.nodes as SystemArchitectureData['nodes'],
    edges: a.edges as SystemArchitectureData['edges'],
  }));

  return (
    <>
      <PageHeader
        path="systems"
        title="AI system architectures"
        description="How the production systems are put together — components, protocols, and the data that flows between them."
        meta={`${serialized.length} diagrams`}
      />
      <SystemsContent architectures={serialized} />
    </>
  );
}
