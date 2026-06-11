import type { Metadata } from 'next';
import { ContactContent } from '@/components/contact/contact-content';

export const metadata: Metadata = {
  title: 'Contact — Shashi Bhushan Vijay',
  description:
    'Get in touch for collaboration, consulting, or engineering discussions. Available for software engineering and AI/ML projects.',
  openGraph: {
    title: 'Contact — Shashi Bhushan Vijay',
    description:
      'Get in touch for collaboration, consulting, or engineering discussions.',
    url: 'https://shashibhushan.dev/contact',
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
