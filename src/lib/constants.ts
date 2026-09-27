export const siteConfig = {
  name: "Shashi Bhushan Vijay",
  shortName: "SBV",
  title: "Shashi Bhushan Vijay — Software Engineer & System Designer",
  description:
    "I design and engineer intelligent software systems spanning machine learning, distributed architectures, indoor localization, AI-powered applications, and modern web platforms.",
  url: "https://shashibhushan.dev",
  ogImage: "/og/default.png",
  portrait:
    "https://res.cloudinary.com/djdvvscoe/image/upload/v1781194339/portfolio/portrait.jpg",
  resume: "/resume/shashi-bhushan-vijay-resume.pdf",
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
  role: "Software Engineer & System Designer",
  headline: "Building systems that understand, locate, and scale.",
  subheadline:
    "I design and engineer intelligent software systems spanning machine learning, distributed architectures, indoor localization, AI-powered applications, and modern web platforms.",
  tags: [
    "Patent Holder",
    "Software Engineer",
    "AI/ML Engineer",
    "Full Stack Developer",
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
    { name: 'Systems', href: '/systems' },
    { name: 'Research', href: '/research' },
    { name: 'Insights', href: '/insights' },
    { name: 'Exploring', href: '/exploring' },
    { name: 'Videos', href: '/videos' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ],
} as const;
