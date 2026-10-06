import type { Metadata } from 'next';
import { AboutContent } from '@/components/about/about-content';
import { PageHeader } from '@/components/ui/section-header';

export const metadata: Metadata = {
  title: 'About',
  description:
    'AI engineer building LLM and RAG applications, machine-learning pipelines, and distributed systems. Published patent in signal processing for indoor positioning.',
  openGraph: {
    title: 'About — Shashi Bhushan Vijay',
    description:
      'AI engineer building LLM and RAG applications, machine-learning pipelines, and distributed systems.',
    url: 'https://shashibhushan.dev/about',
  },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        path="about"
        title="About"
        description="The engineering philosophy, technical depth, and areas of focus behind the work."
      />
      <AboutContent />
    </>
  );
}
