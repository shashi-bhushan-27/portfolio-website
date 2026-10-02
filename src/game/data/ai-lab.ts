/** The four terminals in the AI Lab: an idea, how it works, and where I've built it. */

export type AiTerminalId = 'llm' | 'rag' | 'ocr' | 'ml';

export type AiTerminal = {
  id: AiTerminalId;
  title: string;
  kicker: string;
  concept: string;
  pipelineTitle: string;
  pipeline: string[];
  takeaway: string;
  /** Project ids (see data/projects.ts) and what this idea did there. */
  usedIn: { project: string; how: string }[];
};

export const AI_TERMINALS: Record<AiTerminalId, AiTerminal> = {
  llm: {
    id: 'llm',
    title: 'LLM Terminal',
    kicker: 'Language models in production',
    concept:
      'LLMs are good at reading and classifying messy text, and bad at arithmetic and consistency. The pattern I keep coming back to: let the model extract structured evidence, and let code make the decision.',
    pipelineTitle: 'LLM extracts, code decides',
    pipeline: ['Unstructured input', 'LLM → strict JSON schema', 'Validation & grounding', 'Deterministic logic', 'Explainable result'],
    takeaway:
      'Never let the model do the maths. Scores computed in code are identical on every rerun — and you can explain them.',
    usedIn: [
      {
        project: 'proofstack',
        how: 'Gemini extracts evidence into Pydantic schemas; a pure-Python engine scores it, so reruns give identical scores.',
      },
      {
        project: 'oncofollow-symptom-triage',
        how: 'Role-specific Groq agents for patients, clinicians and admins — while a rule engine owns the emergency decision.',
      },
      {
        project: 'trade-document-intelligence',
        how: 'gpt-oss reads the OCR text; label-anchored rules and the printed page keep every value honest.',
      },
    ],
  },
  rag: {
    id: 'rag',
    title: 'RAG System',
    kicker: 'Retrieval-augmented generation',
    concept:
      'RAG answers from your documents instead of the model’s memory: find the most relevant chunks, then ask the model to answer only from them — and cite them.',
    pipelineTitle: 'RAG pipeline',
    pipeline: ['User query', 'Embedding', 'Vector search', 'Retrieval', 'Reranking', 'LLM', 'Answer'],
    takeaway:
      'When answers get worse, look at retrieval first — chunking, embeddings, the index and ranking — before touching the prompt or the temperature.',
    usedIn: [
      {
        project: 'proofstack',
        how: 'The AI Resume Reviewer interrogates weak résumé claims with RAG and turns verified answers into STAR bullets.',
      },
      {
        project: 'rag-document-qa',
        how: 'SentenceTransformers embeddings in FAISS, answered by Groq with citations, over PDF, TXT and CSV.',
      },
      {
        project: 'automl-assistant',
        how: 'Recommends models from dataset statistics with LangChain, Groq (Llama 3.1) and FAISS.',
      },
      {
        project: 'flex-dca-ai-platform',
        how: 'A compliance copilot over FDCPA and RBI rules, with citations and confidence scores.',
      },
    ],
  },
  ocr: {
    id: 'ocr',
    title: 'OCR Machine',
    kicker: 'Document intelligence',
    concept:
      'Document AI turns scans into data. Reading crisp print is the easy part; the hard part is knowing when a reading can’t be trusted — and doing something different then.',
    pipelineTitle: 'Document pipeline',
    pipeline: ['Document', 'OCR', 'Layout analysis', 'Field extraction', 'Validation', 'Structured output'],
    takeaway:
      'Page-level OCR confidence lies. A handwritten goods receipt scored 98% while merging two numbers into one — measure per line, and route the hard pages to a vision model.',
    usedIn: [
      {
        project: 'trade-document-intelligence',
        how: 'PaddleOCR with layout reconstruction; handwritten or low-confidence pages go to Gemini vision. 48/48 fields on a real invoice and e-way bill.',
      },
      {
        project: 'proofstack',
        how: 'Normalizes multi-column résumé PDFs with PyMuPDF and pdfplumber before any model sees them.',
      },
    ],
  },
  ml: {
    id: 'ml',
    title: 'ML Terminal',
    kicker: 'Classic machine learning',
    concept:
      'Where the data is numeric — signal strength, financial features, tabular datasets — classic ML still does the heavy lifting, and you can explain it.',
    pipelineTitle: 'Dynamic stacking ensemble',
    pipeline: ['RSSI features', 'KNN · Random Forest · XGBoost', 'Gradient Boosting meta-learner', 'Position (x, y)'],
    takeaway:
      'A meta-learner that re-weights its base models for each environment cut RMSE by about 43% — and adapts to new buildings without full retraining.',
    usedIn: [
      {
        project: 'indoor-positioning-system',
        how: 'RMSE from 3.124 to 1.787 (about 43% lower), R² 0.978, about 1.6 m mean error.',
      },
      { project: 'automl-assistant', how: 'Automated training across model families, explained with SHAP.' },
      { project: 'flex-dca-ai-platform', how: 'Three CatBoost models; the recovery model reached an AUC of 0.87.' },
    ],
  },
};
