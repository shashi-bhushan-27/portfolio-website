export const siteConfig = {
  name: "Shashi Bhushan Vijay",
  shortName: "SBV",
  title: "Shashi Bhushan Vijay — AI Engineer (LLM Systems, RAG, ML)",
  description:
    "I build AI systems that ship: LLM and RAG applications, machine-learning pipelines, and the backends and interfaces around them. Indoor-positioning research with a published patent, plus production work across fintech, document intelligence, and HR tech.",
  url: "https://shashibhushan.dev",
  ogImage: "/og/default.png",
  portrait:
    "https://res.cloudinary.com/djdvvscoe/image/upload/v1781194339/portfolio/portrait.jpg",
  /** Serves the résumé set live at /admin/resumes (see src/app/resume/route.ts). */
  resume: "/resume",
  links: {
    github: "https://github.com/shashi-bhushan-27",
    linkedin: "https://www.linkedin.com/in/shashi-bhushan-/",
    twitter: "https://x.com/shashi_vijay_",
    instagram: "https://www.instagram.com/shashi_bhushan_._/",
    youtube: "https://www.youtube.com/@shashibhushan3596",
    email: "shashibhushanvijay@gmail.com",
  },
  phone: "+91 7060049677",
  location: "Haridwar, India",
  timezone: "Asia/Kolkata",
  role: "AI Engineer & System Designer",
  headline: "Building systems that understand, locate, and scale.",
  subheadline:
    "I build AI systems that ship: LLM and RAG applications, machine-learning pipelines, and the backends and interfaces around them. Indoor-positioning research with a published patent, plus production work across fintech, document intelligence, and HR tech.",
  tags: [
    "AI Engineer",
    "LLM Systems",
    "Patent Published",
    "System Designer",
  ],
  /** Headline numbers from the indoor-positioning patent work. */
  readouts: [
    { label: "Patent app.", value: "202541115892" },
    { label: "Mean loc. error", value: "~1.6 m" },
    { label: "R² score", value: "0.978" },
    { label: "Inference", value: "<100 ms" },
  ],
  navigation: [
    { name: 'Work', href: '/work' },
    { name: 'AI Systems', href: '/systems' },
    { name: 'Research', href: '/research' },
    { name: 'Insights', href: '/insights' },
    { name: 'Exploring', href: '/exploring' },
    { name: 'Videos', href: '/videos' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ],
} as const;
