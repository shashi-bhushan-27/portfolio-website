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
  'AI Engineering',
  'LLM Applications & RAG',
  'Machine Learning',
  'System Design',
  'Distributed Systems',
  'Full Stack Development',
  'IoT & Edge',
  'Cloud Applications',
];

export const skillGroups = [
  {
    label: 'LLMs & RAG',
    items: ['RAG', 'FAISS', 'SentenceTransformers', 'LangChain', 'Gemini', 'Groq', 'AI SDK'],
  },
  {
    label: 'Machine learning',
    items: ['Scikit-learn', 'XGBoost', 'LSTM', 'SHAP', 'PaddleOCR'],
  },
  { label: 'Backend', items: ['FastAPI', 'REST APIs', 'Microservices', 'MQTT'] },
  { label: 'Languages', items: ['Python', 'C++', 'Java', 'JavaScript', 'SQL'] },
  { label: 'Databases', items: ['PostgreSQL', 'SQLite'] },
  { label: 'Cloud & tools', items: ['AWS', 'Git', 'Streamlit'] },
];

export const education = {
  school: 'VIT Vellore',
  degree: 'Integrated M.Tech, Computer Science & Engineering',
  expected: 'Expected April 2027',
};

/**
 * The indoor-positioning patent, shown on /research and used by the site assistant.
 * Status is "published": the application is published, not granted — keep the wording.
 */
export const patent = {
  status: 'Patent published',
  title:
    'A system and method for coordinated indoor position determination using multi-stage signal processing',
  applicationNo: '202541115892',
  institution: 'VIT, Vellore, India',
  period: 'Dec 2024 – Dec 2025',
  problem:
    'GPS signals fail in indoor environments due to severe attenuation by walls, ceilings, and structural materials. Existing indoor positioning solutions suffer from high infrastructure costs, poor accuracy beyond 3–5 meters, and lack of adaptability when deployed in new building layouts. There is no generalizable, cost-effective system that achieves sub-2-meter accuracy across diverse indoor environments.',
  methodology:
    'A multi-stage signal processing pipeline using RSSI and BLE signals from ESP32 beacons, processed through a FastAPI + MQTT backend, with a dynamic stacking ML ensemble for position estimation. Raw signal data is collected at edge gateways (Raspberry Pi), filtered and feature-engineered, then fed into a meta-learner that combines multiple base estimators to produce a final position prediction.',
  results: [
    { value: '~1.6', unit: 'm', label: 'Mean localization accuracy' },
    { value: '0.978', unit: '', label: 'R² score' },
    { value: '<100', unit: 'ms', label: 'Inference latency' },
    { value: '50+', unit: '', label: 'Concurrent devices' },
  ],
  innovation:
    'A dynamic stacking ensemble built with Scikit-learn and XGBoost that adapts to different environments without requiring full retraining. The meta-learner automatically selects and weights base models based on local signal characteristics. Complemented by an A* graph-based navigation system that generates optimal paths in previously unseen building layouts using only positioning data and a floor plan graph.',
  hardwareIntegration:
    'ESP32 BLE beacons broadcast calibrated advertising packets at configurable intervals. Raspberry Pi edge gateways aggregate and pre-process signals before publishing to an MQTT broker, enabling lightweight, low-latency message delivery. The edge computing architecture keeps inference close to the data source, minimizing round-trip latency and enabling real-time position updates even in network-constrained environments.',
  hardware: ['ESP32 BLE', 'Raspberry Pi', 'MQTT', 'Edge Computing', 'FastAPI'],
  futureScope: [
    'UWB (Ultra-Wideband) integration for sub-meter accuracy',
    'Federated learning across building deployments',
    'AR navigation overlay for real-time wayfinding',
    'Cloud-edge hybrid architecture for dynamic model updates',
  ],
};

export const researchInterests = [
  {
    title: 'RAG systems & NLP',
    description:
      'Retrieval-augmented generation pipelines, semantic search architectures, and context-grounded language model inference for domain-specific applications.',
  },
  {
    title: 'Ensemble learning methods',
    description:
      'Dynamic stacking, model selection strategies, and meta-learning approaches for improving prediction robustness across heterogeneous data distributions.',
  },
];
