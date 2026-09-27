import type { Metadata } from 'next';
import { ContactContent } from '@/components/contact/contact-content';
import { PageHeader } from '@/components/ui/section-header';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch for collaboration, consulting, or engineering discussions. Available for software engineering and AI/ML projects.',
  openGraph: {
    title: 'Contact — Shashi Bhushan Vijay',
    description: 'Get in touch for collaboration, consulting, or engineering discussions.',
    url: 'https://shashibhushan.dev/contact',
  },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        path="contact"
        title="Let's talk."
        description="Have a project in mind, an engineering challenge to discuss, or just want to connect? I'd love to hear from you."
      />
      <ContactContent />
    </>
  );
}
