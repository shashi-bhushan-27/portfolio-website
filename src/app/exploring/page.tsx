import type { Metadata } from 'next';
import { ExploringContent } from '@/components/exploring/exploring-content';

export const metadata: Metadata = {
  title: 'Exploring — Shashi Bhushan Vijay',
  description:
    'A public engineering journal of topics I\'m actively researching — from advanced system design and AI agents to MLOps and quantitative finance.',
  openGraph: {
    title: 'Exploring — Shashi Bhushan Vijay',
    description:
      'A public engineering journal of topics I\'m actively researching and experimenting with.',
    url: 'https://shashibhushan.dev/exploring',
  },
};

export default function ExploringPage() {
  return <ExploringContent />;
}
