import type { Metadata } from 'next';
import { ResearchContent } from '@/components/research/research-content';
import { PageHeader } from '@/components/ui/section-header';

export const metadata: Metadata = {
  title: 'Research',
  description:
    'Research publications, patents, and academic contributions in indoor positioning, ML, and signal processing.',
};

export default function ResearchPage() {
  return (
    <>
      <PageHeader
        path="research"
        title="Research & publications"
        description="Signal processing, machine learning, and embedded systems — from a published patent to production prototypes."
      />
      <ResearchContent />
    </>
  );
}
