/**
 * Static profile content shared by several pages (home, about, exploring).
 * Database-backed content (projects, articles, videos…) lives in Postgres.
 */

export type TopicStatus = 'Active' | 'Exploring' | 'Paused';

export const topics: { title: string; status: TopicStatus; description: string }[] = [
  {
    title: 'Advanced System Design',
    status: 'Active',
    description:
      'Studying distributed system patterns, consensus algorithms, and scalable architectures.',
  },
  {
    title: 'AI Agents & Autonomous Systems',
    status: 'Active',
    description:
      'Exploring multi-agent architectures, tool-use patterns, and autonomous reasoning systems.',
  },
  {
    title: 'LLM Applications & RAG',
    status: 'Active',
    description:
      'Building production RAG pipelines, fine-tuning strategies, and prompt engineering.',
  },
  {
    title: 'ML Deployment & MLOps',
    status: 'Active',
    description: 'Model serving, monitoring, A/B testing, and continuous training pipelines.',
  },
  {
    title: 'Cloud Infrastructure',
    status: 'Exploring',
    description: 'AWS services, serverless architectures, and infrastructure as code.',
  },
  {
    title: 'High-Performance Systems',
    status: 'Exploring',
    description: 'Low-latency systems, caching strategies, and performance optimization.',
  },
  {
    title: 'Quantitative Finance',
    status: 'Paused',
    description: 'Options pricing models, algorithmic trading, and risk management systems.',
  },
  {
    title: 'Blockchain & Web3',
    status: 'Paused',
    description: 'Smart contract patterns, DeFi protocols, and decentralized architectures.',
  },
];

export const principles = [
  {
    title: 'Systems thinking',
    description:
      'Understanding how components interact matters more than individual optimizations.',
  },
  {
    title: 'Research-driven',
    description: 'Every engineering decision should be informed by data, not assumptions.',
  },
  {
    title: 'Production mindset',
    description: "Code that doesn't ship doesn't matter. I build for deployment.",
  },
  {
    title: 'Continuous learning',
    description: 'Technology evolves rapidly. Staying current is a professional obligation.',
  },
];

export const expertiseAreas = [
  'Software Engineering',
  'Full Stack Development',
  'AI/ML',
  'System Design',
  'Distributed Systems',
  'IoT',
  'Blockchain',
  'Cloud Applications',
];

export const skillGroups = [
  { label: 'Languages', items: ['C++', 'Java', 'Python', 'JavaScript', 'SQL'] },
  { label: 'Backend', items: ['FastAPI', 'REST APIs', 'Microservices', 'MQTT'] },
  {
    label: 'ML & AI',
    items: ['Scikit-learn', 'XGBoost', 'LSTM', 'SHAP', 'RAG', 'FAISS', 'LangChain', 'Groq'],
  },
  { label: 'Databases', items: ['PostgreSQL', 'SQLite'] },
  { label: 'Cloud & tools', items: ['AWS', 'Git', 'Streamlit'] },
];

export const education = {
  school: 'VIT Vellore',
  degree: 'Integrated M.Tech, Computer Science & Engineering',
  expected: 'Expected April 2027',
};
