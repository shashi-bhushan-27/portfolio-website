import { siteConfig } from '@/lib/constants';
import { education } from '@/lib/content';

/** Recruiter mode: the whole portfolio on one card, no game required. */
export const PROFILE = {
  name: siteConfig.name,
  role: 'AI / Software Engineer',
  location: siteConfig.location,
  education: `${education.degree}, ${education.school} — ${education.expected.toLowerCase()}`,
  topProjects: ['indoor-positioning-system', 'proofstack', 'trade-document-intelligence', 'lendloop'],
  patent: 'Indoor positioning — published patent application no. 202541115892',
  core: ['AI / ML', 'LLM systems', 'Backend', 'DSA'],
  highlights: [
    '1st place, ARC Hackathon (ARC Lab, VIT) — AutoML Assistant',
    'Led a team of six on Trade Document Intelligence',
    'About 1.6 m indoor positioning accuracy, R² 0.978',
  ],
  links: {
    resume: siteConfig.resume,
    github: siteConfig.links.github,
    linkedin: siteConfig.links.linkedin,
    contact: '/contact',
    email: siteConfig.links.email,
  },
};
