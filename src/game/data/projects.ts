/**
 * Project machines in the Project Garage. Short, in-game versions of the case studies
 * on /work — sourced from the case studies, the résumé and the project repos. The id
 * is the case-study slug, so "View full project" links straight to it.
 */

export type GameProject = {
  id: string;
  name: string;
  tagline: string;
  domain: string;
  year: string;
  note?: string;
  problem: string;
  solution: string;
  pipeline: string[];
  stack: string[];
  built: string[];
  results: { label: string; value: string }[];
  github?: string;
  demo?: string;
};

export const PROJECTS: GameProject[] = [
  {
    id: 'indoor-positioning-system',
    name: 'Indoor Positioning & Navigation',
    tagline: 'Indoor localization with a published patent application: about 1.6 m accuracy where GPS fails.',
    domain: 'IoT / Machine Learning',
    year: '2024–2025',
    note: 'Patent application published · VIT Vellore',
    problem:
      'GPS degrades indoors. Existing indoor systems are expensive, often inaccurate beyond 3–5 m, and don’t adapt to new building layouts.',
    solution:
      'ESP32 radios collect Wi-Fi/BLE signal strength, Raspberry Pi gateways stream it over MQTT, a dynamic stacking ensemble predicts position, and A* routes the user through the floor plan.',
    pipeline: [
      'Wi-Fi / BLE RSSI (ESP32)',
      'Edge gateway → MQTT',
      'Feature processing',
      'Dynamic stacking ensemble',
      'Position prediction',
      'A* navigation',
    ],
    stack: ['ESP32', 'Raspberry Pi', 'MQTT', 'FastAPI', 'Scikit-learn', 'XGBoost', 'NetworkX', 'Python'],
    built: [
      'An ESP32 Wi-Fi sniffer on a robotic car that built the radio map automatically: 4,277 RSSI records across 209 access points, no manual site survey.',
      'A dynamic stacking ensemble (KNN, Random Forest, XGBoost → Gradient Boosting meta-learner) that cut RMSE from 3.124 to 1.787, about 43%.',
      'The real-time pipeline — MQTT, Raspberry Pi and Python — from raw scans to live predictions.',
      'A* indoor routing with NetworkX, recalculated from each predicted position.',
    ],
    results: [
      { label: 'Mean error', value: '~1.6 m' },
      { label: 'R²', value: '0.978' },
      { label: 'Inference', value: '< 100 ms' },
      { label: 'Patent app.', value: '202541115892' },
    ],
  },
  {
    id: 'proofstack',
    name: 'ProofStack — AI Resume Reviewer',
    tagline: 'Verifies résumé claims with evidence instead of matching keywords.',
    domain: 'AI / HRTech / SaaS',
    year: '2026',
    problem:
      'ATS keyword matching lets anyone score 100% by listing skills, and an LLM grading résumés on its own gives inconsistent, hallucinated scores.',
    solution:
      'The LLM only extracts evidence into a strict schema; a deterministic engine does the scoring. A RAG-driven interview then probes the weakest claims.',
    pipeline: [
      'Résumé PDF',
      'Normalize text (PyMuPDF / pdfplumber)',
      '7-stage concurrent extraction (Gemini)',
      'Evidence tiers (strict Pydantic schema)',
      'Deterministic scoring engine',
      'RAG interrogation → STAR bullets',
    ],
    stack: ['Next.js', 'FastAPI', 'Google Gemini', 'Pydantic', 'PostgreSQL', 'SQLAlchemy', 'Redis', 'Firebase Auth', 'Cashfree'],
    built: [
      'An async, 7-stage concurrent extraction pipeline on FastAPI and Gemini: 40% faster processing, under 3 s median response.',
      'Background processing, indexing, connection pooling and Redis caching: queries 60% faster, database load down 85%.',
      'Hybrid auth — Firebase Auth with PostgreSQL row-level security and short-lived anonymous JWTs for guest evaluations.',
      'Cashfree billing with HMAC-SHA256 verification of raw webhook bodies.',
    ],
    results: [
      { label: 'Score consistency', value: 'Identical on reruns' },
      { label: 'Median response', value: '< 3 s' },
      { label: 'Database load', value: '−85%' },
    ],
    github: 'https://github.com/shashi-bhushan-27/proofStack',
    demo: 'https://proof-stack-xi.vercel.app',
  },
  {
    id: 'trade-document-intelligence',
    name: 'Trade Document Intelligence',
    tagline: 'Reads printed and handwritten trade documents into checked, structured data.',
    domain: 'AI / Document Intelligence',
    year: '2026',
    note: 'Team of six · private repository',
    problem:
      'Each shipment produces an invoice, an e-way bill, a handwritten goods receipt note and a weighbridge slip that someone retypes and cross-checks by hand.',
    solution:
      'OCR with layout reconstruction, then a router: printed documents go to an open-weight LLM reading the text; handwritten or low-confidence ones go straight to a vision model. Every value is grounded and cross-checked.',
    pipeline: [
      'Upload (processed in the background)',
      'OCR: PDF text layer or PaddleOCR + layout',
      'Confidence router',
      'Text LLM (gpt-oss) or vision (Gemini)',
      'Grounding + GSTIN check digits',
      'Cross-document validation',
      'Human review',
    ],
    stack: ['Python', 'FastAPI', 'PaddleOCR', 'OpenCV', 'Groq gpt-oss-120b', 'Gemini', 'SQLAlchemy', 'SQLite', 'RapidFuzz', 'React 19'],
    built: [
      'Led a team of six; owned the architecture, integration and code review across OCR, extraction, validation, backend and frontend.',
      'A confidence router that also measures the share of text from low-confidence lines — catching handwriting that a page average hides.',
      'Hybrid rules + LLM extraction with a gpt-oss-120b → gpt-oss-20b → Gemini fallback chain, grounded against the OCR text.',
      'An HSN-aware item dropdown over 22,000+ GST codes that learns from reviewer corrections.',
    ],
    results: [
      { label: 'Field accuracy', value: '48/48 (3 runs)' },
      { label: 'HSN/SAC codes', value: '22,000+' },
      { label: 'Tests', value: '297, offline' },
    ],
  },
  {
    id: 'lendloop',
    name: 'LendLoop',
    tagline: 'Campus lending for VIT students, with signed QR handoffs and a trust score.',
    domain: 'Mobile / Marketplace',
    year: '2026',
    note: 'Capstone project · VIT',
    problem:
      'Lending to a stranger has no proof of handoff, no record of condition and no consequence for returning late — so it mostly doesn’t happen.',
    solution:
      'A verified, VIT-only community; signed single-use QR codes at pickup and return; and a transparent 0–100 trust score that follows each user.',
    pipeline: [
      'List an item',
      'Borrow request',
      'Lender approves',
      'Pickup QR (signed, 30 min, single-use)',
      'Return QR',
      'Trust scores update',
    ],
    stack: ['Flutter', 'Riverpod', 'FastAPI', 'PostgreSQL (Neon)', 'SQLAlchemy', 'Firebase Auth', 'FCM', 'Cloudinary', 'Upstash Redis'],
    built: [
      'A Flutter (Riverpod + GoRouter) Android app on an async FastAPI backend and Neon Postgres.',
      'QR handoffs signed with HMAC-SHA256, expiring after 30 minutes, rejected on reuse.',
      'Real-time updates through FCM pushes sent after each commit — robust to a sleeping free-tier backend.',
      'A trust score from return rate, reviews, overdue penalties and lending activity, with an immutable audit trail.',
    ],
    results: [
      { label: 'Sign-up', value: 'VIT email only' },
      { label: 'QR tokens', value: 'Signed, single-use' },
      { label: 'Trust score', value: '0–100' },
    ],
    github: 'https://github.com/shashi-bhushan-27/lendloop',
  },
  {
    id: 'automl-assistant',
    name: 'AutoML Assistant',
    tagline: 'Upload a dataset; get a trained, explained, deployable model — no code.',
    domain: 'ML / SaaS',
    year: '2026',
    note: '1st place · ARC Hackathon',
    problem:
      'Non-experts struggle with preprocessing, model selection and tuning, and most AutoML tools don’t explain their choices.',
    solution:
      'Automated preprocessing and training, LLM-powered model recommendations grounded in the dataset’s statistics, and SHAP explanations for every model.',
    pipeline: [
      'Dataset upload',
      'Automated preprocessing',
      'RAG recommendation (LangChain + Groq + FAISS)',
      'Training: regression · classification · forecasting',
      'SHAP explainability',
      'FastAPI /predict endpoints',
    ],
    stack: ['Streamlit', 'FastAPI', 'LangChain', 'Groq (Llama 3.1)', 'FAISS', 'XGBoost', 'Scikit-learn', 'SHAP'],
    built: [
      'An end-to-end platform from upload to a deployment-ready model.',
      'Regression, classification and forecasting with XGBoost, Random Forest, ARIMA/SARIMAX and optional LSTM.',
      'Model recommendations via RAG (LangChain, Groq Llama 3.1, FAISS) using the dataset’s statistics.',
      'SHAP feature importance, beeswarm, waterfall and dependence plots.',
    ],
    results: [
      { label: 'ARC Hackathon', value: '1st place' },
      { label: 'Explainability', value: 'SHAP' },
      { label: 'Serving', value: '/predict API' },
    ],
    github: 'https://github.com/shashi-bhushan-27/AutoML_Assistant',
    demo: 'https://shashibhushan27-automl.hf.space',
  },
  {
    id: 'oncofollow-symptom-triage',
    name: 'OncoFollow',
    tagline: 'Symptom triage between visits for breast cancer survivors.',
    domain: 'Healthcare Technology',
    year: '2026',
    problem:
      'Complications can develop between scheduled visits, and survivors can’t easily judge urgency — leading to needless emergency trips or dangerous delays.',
    solution:
      'A rule-based triage engine with a red-flag override, plus role-specific LLM agents for patients, clinicians and admins, anchored in clinical guidelines.',
    pipeline: [
      'Symptom report',
      'Red-flag scan → emergency override',
      'Score: severity · duration · frequency · trend',
      'Routine / Soon / Urgent',
      'Role-specific LLM agents (Groq)',
      'Clinician dashboard (NEWS2)',
    ],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Groq'],
    built: [
      'Rule-based triage across 20 symptom categories and 4 scoring dimensions, with red-flag detection and override.',
      'Separate LLM agents for patients, clinicians and admins through role-specific prompts and structured JSON output.',
      'Answers anchored in NCCN/ASCO guidelines with citations, plus output validation and blocked-phrase filtering.',
      'Recharts dashboards with NEWS2 acuity scoring.',
    ],
    results: [
      { label: 'Emergency sensitivity', value: '99%' },
      { label: 'Symptom categories', value: '20' },
      { label: 'Scoring dimensions', value: '4' },
    ],
    github: 'https://github.com/shashi-bhushan-27/TARP_oncofollow',
    demo: 'https://tarp-oncofollow.vercel.app/',
  },
  {
    id: 'flex-dca-ai-platform',
    name: 'FLEX-DCA',
    tagline: 'Recovery prediction, case allocation and a compliance copilot for debt collection.',
    domain: 'FinTech / AI',
    year: '2025–2026',
    problem:
      'Collection agencies must maximise recovery while staying compliant with FDCPA and RBI rules; manual allocation is suboptimal and legal questions are expensive.',
    solution:
      'CatBoost models predict recovery, an allocation engine assigns cases, and a RAG copilot answers compliance questions with citations.',
    pipeline: ['Case ingestion', '3 CatBoost models', 'Allocation engine', 'Dashboard KPIs', 'RAG compliance copilot (FAISS + Groq)'],
    stack: ['FastAPI', 'React', 'SQLite', 'CatBoost', 'FAISS', 'LangChain', 'Groq'],
    built: [
      'Financial feature engineering with SMOTE oversampling for minority classes.',
      'Three CatBoost models feeding an automated allocation engine.',
      'A citation-grounded RAG copilot with confidence scores for compliance questions.',
    ],
    results: [
      { label: 'Recovery model AUC', value: '0.87' },
      { label: 'Allocation vs baseline', value: '+23%' },
      { label: 'Compliance answers', value: '94% relevant' },
    ],
    github: 'https://github.com/shashi-bhushan-27/fedX_hackathon',
  },
  {
    id: 'rag-document-qa',
    name: 'RAG Document Q&A',
    tagline: 'Semantic search and grounded answers over PDF, TXT and CSV files.',
    domain: 'AI / NLP',
    year: '2025–2026',
    problem: 'Keyword search misses meaning across large document collections.',
    solution:
      'Chunk and embed documents into FAISS, retrieve by meaning, and answer with a grounded LLM response that cites its sources.',
    pipeline: [
      'Upload PDF / TXT / CSV',
      'Text extraction',
      'Chunking + embeddings (SentenceTransformers)',
      'FAISS vector store',
      'Semantic retrieval',
      'Groq LLM → answer with citations',
    ],
    stack: ['FastAPI', 'FAISS', 'SentenceTransformers', 'Groq', 'Python'],
    built: [
      'Format-specific text extractors with fallback chains.',
      'Overlapping chunk windows that preserve context across boundaries.',
      'Incremental vector-store updates and citation tracking for every answer.',
    ],
    results: [
      { label: 'Query latency', value: '< 2 s end-to-end' },
      { label: 'Formats', value: 'PDF · TXT · CSV' },
    ],
    github: 'https://github.com/shashi-bhushan-27/ragLLM',
  },
  {
    id: 'quantfinance-platform',
    name: 'quantFinance',
    tagline: 'Finds mispriced AMZN options with ensemble pricing models.',
    domain: 'FinTech / Quant',
    year: '2026',
    note: 'Built at Convolve 4.0',
    problem:
      'Real option prices drift from theory; spotting mispricing takes several pricing models, volatility forecasts and risk management working together.',
    solution:
      'An ensemble of Black-Scholes and Heston with EWMA and GARCH volatility forecasts, Greeks, and multi-timeframe trading signals.',
    pipeline: [
      'Market data',
      'Volatility: EWMA + GARCH',
      'Ensemble pricing: Black-Scholes + Heston',
      'Greeks',
      'Mispricing detection',
      'Signals → React dashboard',
    ],
    stack: ['Python', 'FastAPI', 'SQLite', 'React', 'Black-Scholes', 'Heston', 'GARCH'],
    built: [
      'Built for Convolve 4.0, the Pan-IIT AI/ML hackathon.',
      'Dynamic volatility forecasting and vectorized Greeks for real-time risk management.',
      'A React dashboard for signal monitoring and P&L tracking.',
    ],
    results: [
      { label: 'Underlying', value: 'AMZN options' },
      { label: 'Pricing', value: 'BS + Heston ensemble' },
    ],
    github: 'https://github.com/shashi-bhushan-27/quantFinance',
  },
  {
    id: 'blockchain-crowdfunding',
    name: 'Blockchain Crowdfunding',
    tagline: 'Transparent crowdfunding with smart contracts and MetaMask.',
    domain: 'Blockchain / Web3',
    year: '2025',
    problem: 'Donors on traditional platforms can’t verify how funds are used, and intermediaries take a cut.',
    solution:
      'Solidity contracts hold and release funds transparently; a React front end talks to Ethereum through Web3.js and MetaMask.',
    pipeline: ['Campaign factory contract', 'Per-campaign contracts', 'Hardhat tests', 'React + Web3.js', 'MetaMask', 'Ethereum'],
    stack: ['Solidity', 'Hardhat', 'React', 'Web3.js', 'Ethereum', 'MetaMask'],
    built: [
      'Factory and campaign contracts with gas-conscious data structures.',
      'Optimistic UI with transaction-confirmation tracking and robust wallet state.',
      'Smart-contract unit tests with Hardhat.',
    ],
    results: [
      { label: 'Contracts', value: 'Factory + campaigns' },
      { label: 'Wallet', value: 'MetaMask' },
    ],
    github: 'https://github.com/shashi-bhushan-27/blockchain_based_crowdfunding',
  },
];

export const projectById = (id: string) => PROJECTS.find((p) => p.id === id);
