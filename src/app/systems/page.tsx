import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { SystemsContent } from '@/components/systems/systems-content';
import type { SystemArchitectureData } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Systems — Shashi Bhushan Vijay',
  description:
    'Interactive system architecture explorer showcasing engineering designs across ML, IoT, blockchain, and full-stack systems.',
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

  return <SystemsContent architectures={serialized} />;
}
