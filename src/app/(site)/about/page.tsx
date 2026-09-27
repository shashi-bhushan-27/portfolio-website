import type { Metadata } from 'next';
import { AboutContent } from '@/components/about/about-content';
import { PageHeader } from '@/components/ui/section-header';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Software engineer specializing in machine learning, distributed systems, indoor localization, and AI-powered applications. Patent holder in signal processing for indoor positioning.',
  openGraph: {
    title: 'About — Shashi Bhushan Vijay',
    description:
      'Software engineer specializing in machine learning, distributed systems, indoor localization, and AI-powered applications.',
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
