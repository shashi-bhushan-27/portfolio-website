import type { Metadata } from 'next';
import { ExploringContent } from '@/components/exploring/exploring-content';
import { PageHeader } from '@/components/ui/section-header';

const description =
  "A public engineering journal of topics I'm actively researching — from advanced system design and AI agents to LLM applications and MLOps.";

export const metadata: Metadata = {
  title: 'Exploring',
  description,
  openGraph: {
    title: 'Exploring — Shashi Bhushan Vijay',
    description: "A public engineering journal of topics I'm actively researching and experimenting with.",
    url: 'https://shashibhushan.dev/exploring',
  },
};

export default function ExploringPage() {
  return (
    <>
      <PageHeader
        path="exploring"
        title="What I'm exploring"
        description="A public engineering journal of topics I'm actively researching and experimenting with."
      />
      <ExploringContent />
    </>
  );
}
