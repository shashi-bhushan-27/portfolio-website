import type { Metadata } from 'next';
import { ResearchContent } from '@/components/research/research-content';

export const metadata: Metadata = {
  title: 'Research — Shashi Bhushan Vijay',
  description:
    'Research publications, patents, and academic contributions in indoor positioning, ML, and signal processing.',
};

export default function ResearchPage() {
  return <ResearchContent />;
}
