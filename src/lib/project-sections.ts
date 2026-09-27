/**
 * The case-study sections of a project, in page order. Shared by the admin
 * editor (labels + writing prompts) and server-side validation. Each is
 * Markdown and optional; empty sections are hidden on the public page.
 */
export const PROJECT_SECTIONS = [
  {
    key: 'executiveSummary',
    label: 'Executive summary',
    hint: 'The whole project in a paragraph: what it is, who it’s for, and the headline result.',
  },
  {
    key: 'problemStatement',
    label: 'Problem statement',
    hint: 'What was broken or missing, and why it mattered.',
  },
  {
    key: 'systemArchitecture',
    label: 'System architecture',
    hint: 'The main components and how data flows between them.',
  },
  {
    key: 'technologyDecisions',
    label: 'Technology decisions',
    hint: 'What you chose, what you considered, and why.',
  },
  {
    key: 'engineeringTradeoffs',
    label: 'Engineering trade-offs',
    hint: 'What you gave up to get what you needed.',
  },
  {
    key: 'challengesFaced',
    label: 'Challenges',
    hint: 'The hardest problems you hit. Shown side by side with Solutions.',
  },
  {
    key: 'solutionsImplemented',
    label: 'Solutions',
    hint: 'How you solved them.',
  },
  {
    key: 'performanceMetrics',
    label: 'Performance',
    hint: 'Measured results: accuracy, latency, cost, users, scale.',
  },
  {
    key: 'lessonsLearned',
    label: 'Lessons learned',
    hint: 'What you’d tell someone building this next.',
  },
  {
    key: 'futureImprovements',
    label: 'Future improvements',
    hint: 'What you’d build or change next.',
  },
] as const;

export type ProjectSectionKey = (typeof PROJECT_SECTIONS)[number]['key'];
