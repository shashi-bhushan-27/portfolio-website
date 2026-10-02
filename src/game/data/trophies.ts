/** The Trophy Room. Only real achievements, from the résumé and the research page. */

export type Trophy = {
  id: string;
  kind: string;
  title: string;
  facts: [string, string][];
  body: string;
  items?: string[];
  link?: { label: string; href: string };
};

export const TROPHIES: Record<string, Trophy> = {
  patent: {
    id: 'patent',
    kind: 'Patent application',
    title: 'Coordinated indoor position determination using multi-stage signal processing',
    facts: [
      ['Application no.', '202541115892'],
      ['Status', 'Published (not yet granted)'],
      ['Institution', 'VIT, Vellore'],
      ['Period', 'Dec 2024 – Dec 2025'],
    ],
    body: 'A multi-stage signal-processing pipeline over ESP32 Wi-Fi/BLE signal strength, with a dynamic stacking ensemble and A* navigation — about 1.6 m mean error and R² 0.978.',
    link: { label: 'Read the research', href: '/research' },
  },
  'arc-hackathon': {
    id: 'arc-hackathon',
    kind: 'Hackathon',
    title: '1st Place — ARC Hackathon',
    facts: [
      ['Organiser', 'ARC Lab, VIT'],
      ['Project', 'AutoML Assistant'],
    ],
    body: 'A GUI-based AutoML tool that automatically benchmarks and recommends the best ML model for any dataset — winning against the competing teams.',
    link: { label: 'See the project', href: '/work/automl-assistant' },
  },
  convolve: {
    id: 'convolve',
    kind: 'Hackathon',
    title: 'Convolve 4.0 — Pan-IIT AI/ML Hackathon',
    facts: [
      ['Project', 'quantFinance'],
      ['When', 'Jan – Feb 2026'],
    ],
    body: 'Built a quant platform that detects mispriced AMZN option contracts with ensemble pricing models (Black-Scholes, Heston) and generates trading signals.',
    link: { label: 'See the project', href: '/work/quantfinance-platform' },
  },
  iste: {
    id: 'iste',
    kind: 'Leadership',
    title: 'Sponsorship Coordinator, ISTE Chapter — VIT Vellore',
    facts: [
      ['Raised', '₹1,00,000+'],
      ['For', 'Horizon, the chapter’s flagship hackathon'],
    ],
    body: 'Secured corporate sponsorships by pitching to 100+ founders and startups, ran the event’s logistics end to end, and developed outreach frameworks that built industry connections for future events.',
  },
  research: {
    id: 'research',
    kind: 'Research',
    title: 'Indoor localization: the numbers',
    facts: [
      ['Mean error', '~1.6 m (MAE 1.468 m)'],
      ['R²', '0.978'],
      ['RMSE', '3.124 → 1.787'],
    ],
    body: '4,277 signal-strength records across 209 access points, captured by an ESP32 sniffer riding a robotic car instead of a manual site survey.',
    link: { label: 'Research page', href: '/research' },
  },
  certifications: {
    id: 'certifications',
    kind: 'Certifications',
    title: 'Certifications',
    facts: [],
    body: 'Courses completed alongside the degree.',
    items: ['Stock Market Basics & Technical Analysis', 'Designing Seamless Notification Service'],
  },
};
