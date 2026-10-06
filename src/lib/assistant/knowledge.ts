import 'server-only';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { siteConfig } from '@/lib/constants';
import {
  education,
  expertiseAreas,
  patent,
  principles,
  researchInterests,
  skillGroups,
  topics,
} from '@/lib/content';
import { extractToc } from '@/lib/markdown';
import { PROJECT_ORDER } from '@/lib/projects';
import { youtubeWatchUrl } from '@/lib/youtube';
import type { SystemArchitectureData } from '@/lib/types';

/**
 * Everything the site assistant may say comes from these documents. Each one
 * carries the exact site URL it was taken from, so answers can link to it.
 */
export type KnowledgeDoc = {
  kind: 'profile' | 'research' | 'project' | 'article' | 'system' | 'video' | 'page';
  title: string;
  /** Site-relative URL (or an external URL for videos). */
  url: string;
  /** One line, used in the catalog when the full text doesn't fit. */
  summary: string;
  /** Tags, stack, category — weighted higher when ranking. */
  keywords: string;
  /** Full text, already formatted for the prompt. */
  body: string;
};

/** Revalidated from admin server actions whenever public content changes. */
export const KNOWLEDGE_TAG = 'assistant-knowledge';

const ARTICLE_BODY_MAX = 8_000;

function clip(text: string, max: number) {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max).trimEnd()}\n[…truncated — the full text is on the page]` : t;
}

/** Case-study section anchors, matching `id`s in components/work/case-study-content.tsx. */
const CASE_STUDY_SECTIONS = [
  ['summary', 'Executive summary', 'executiveSummary'],
  ['problem', 'Problem statement', 'problemStatement'],
  ['architecture', 'System architecture', 'systemArchitecture'],
  ['decisions', 'Technology decisions', 'technologyDecisions'],
  ['tradeoffs', 'Engineering trade-offs', 'engineeringTradeoffs'],
  ['challenges', 'Challenges', 'challengesFaced'],
  ['challenges', 'Solutions', 'solutionsImplemented'],
  ['performance', 'Performance', 'performanceMetrics'],
  ['lessons', 'Lessons learned', 'lessonsLearned'],
  ['future', 'Future improvements', 'futureImprovements'],
] as const;

function profileDoc(): KnowledgeDoc {
  const { links } = siteConfig;
  return {
    kind: 'profile',
    title: `About ${siteConfig.name}`,
    url: '/about',
    summary: `${siteConfig.role} based in ${siteConfig.location}.`,
    keywords: [...expertiseAreas, ...skillGroups.flatMap((g) => g.items)].join(', '),
    body: [
      `Name: ${siteConfig.name}. Role: ${siteConfig.role}. Location: ${siteConfig.location}.`,
      `Headline: ${siteConfig.headline} ${siteConfig.subheadline}`,
      `Profile tags: ${siteConfig.tags.join(', ')}.`,
      `In his words (from /about): I'm an AI engineer who designs and builds intelligent systems — LLM and RAG applications, document intelligence, machine learning pipelines, and the backends that serve them. I have a published patent in signal processing for indoor positioning and have built production-grade platforms across fintech, HR tech, trade documents, and IoT. My approach is rooted in understanding the problem deeply before writing code.`,
      `Education: ${education.degree}, ${education.school} (${education.expected}).`,
      `Principles: ${principles.map((p) => `${p.title} — ${p.description}`).join(' | ')}`,
      `Areas: ${expertiseAreas.join(', ')}.`,
      `Toolbox: ${skillGroups.map((g) => `${g.label}: ${g.items.join(', ')}`).join('; ')}.`,
      `Contact: email ${links.email}, phone ${siteConfig.phone}, contact form at /contact. Résumé (PDF): /resume.`,
      `Profiles: GitHub ${links.github} · LinkedIn ${links.linkedin} · X ${links.twitter} · YouTube ${links.youtube} · Instagram ${links.instagram}.`,
    ].join('\n'),
  };
}

function researchDoc(): KnowledgeDoc {
  return {
    kind: 'research',
    title: `Patent: ${patent.title}`,
    url: '/research',
    summary: `${patent.status} — application no. ${patent.applicationNo}, indoor positioning.`,
    keywords: `patent, indoor positioning, localization, RSSI, BLE, ESP32, ensemble, ${patent.hardware.join(', ')}`,
    body: [
      `Status: ${patent.status} (a published patent application, not a granted patent). Application no. ${patent.applicationNo}. Institution: ${patent.institution}. Period: ${patent.period}.`,
      `Research problem: ${patent.problem}`,
      `Methodology: ${patent.methodology}`,
      `Key results: ${patent.results.map((r) => `${r.label} ${r.value}${r.unit ? ` ${r.unit}` : ''}`).join('; ')}.`,
      `Technical innovation: ${patent.innovation}`,
      `Hardware integration: ${patent.hardwareIntegration} Hardware: ${patent.hardware.join(', ')}.`,
      `Future scope: ${patent.futureScope.join('; ')}.`,
      `Additional research interests: ${researchInterests.map((r) => `${r.title} — ${r.description}`).join(' | ')}`,
    ].join('\n'),
  };
}

function exploringDoc(): KnowledgeDoc {
  return {
    kind: 'page',
    title: 'Exploring — topics he is currently researching',
    url: '/exploring',
    summary: 'Public research log of topics in progress.',
    keywords: topics.map((t) => t.title).join(', '),
    body: topics.map((t) => `- ${t.title} [${t.status}]: ${t.description}`).join('\n'),
  };
}

function systemDoc(a: SystemArchitectureData): KnowledgeDoc {
  const byId = new Map(a.nodes.map((n) => [n.id, n.label]));
  return {
    kind: 'system',
    title: `Architecture diagram: ${a.title}`,
    url: `/systems#${a.architectureId}`,
    summary: a.description,
    keywords: a.nodes.map((n) => `${n.label} ${n.tech}`).join(', '),
    body: [
      a.description,
      `Components: ${a.nodes.map((n) => `${n.label} (${n.tech})`).join('; ')}.`,
      `Data flow: ${a.edges
        .map((e) => `${byId.get(e.from) ?? e.from} → ${byId.get(e.to) ?? e.to}${e.label ? ` (${e.label})` : ''}`)
        .join('; ')}.`,
    ].join('\n'),
  };
}

async function buildKnowledge(): Promise<KnowledgeDoc[]> {
  const [projects, articles, videos, systems, milestones] = await Promise.all([
    prisma.project.findMany({ where: { status: 'PUBLISHED' }, orderBy: PROJECT_ORDER }),
    prisma.article.findMany({ where: { status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' } }),
    prisma.video.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] }),
    prisma.systemArchitecture.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.milestone.findMany({ orderBy: { createdAt: 'asc' } }),
  ]);

  const docs: KnowledgeDoc[] = [profileDoc(), researchDoc()];

  for (const p of projects) {
    const url = `/work/${p.slug}`;
    const metrics = Object.entries((p.metrics as Record<string, string> | null) ?? {})
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
    const links = [p.githubUrl && `Source code: ${p.githubUrl}`, p.liveUrl && `Live demo: ${p.liveUrl}`]
      .filter(Boolean)
      .join(' · ');
    const sections = CASE_STUDY_SECTIONS.map(([id, label, key]) => {
      const text = p[key]?.trim();
      return text ? `#### ${label} (${url}#${id})\n${text}` : '';
    }).filter(Boolean);

    docs.push({
      kind: 'project',
      title: `Project: ${p.title}`,
      url,
      summary: p.excerpt,
      keywords: [p.domain, p.year, ...p.technologies].join(', '),
      body: [
        `Domain: ${p.domain}. Year: ${p.year}.${p.featured ? ' Featured on the home page.' : ''}`,
        `Stack: ${p.technologies.join(', ')}.`,
        metrics && `Metrics: ${metrics}.`,
        links,
        `Summary: ${p.excerpt}`,
        ...sections,
      ]
        .filter(Boolean)
        .join('\n'),
    });
  }

  for (const a of articles) {
    const url = `/insights/${a.slug}`;
    const content = a.content?.trim() ?? '';
    const toc = content ? extractToc(content) : [];
    docs.push({
      kind: 'article',
      title: `Article: ${a.title}`,
      url,
      summary: a.excerpt,
      keywords: [a.category, ...a.tags].join(', '),
      body: [
        `Category: ${a.category}. Published ${a.publishedAt.toISOString().slice(0, 10)}. ${a.readingTime} min read. Tags: ${a.tags.join(', ')}.`,
        `Excerpt: ${a.excerpt}`,
        toc.length > 0 && `Sections: ${toc.map((t) => `${t.text} (${url}#${t.id})`).join('; ')}.`,
        content && `Text (written in first person by Shashi):\n${clip(content, ARTICLE_BODY_MAX)}`,
      ]
        .filter(Boolean)
        .join('\n'),
    });
  }

  for (const s of systems) {
    docs.push(
      systemDoc({
        ...s,
        nodes: s.nodes as SystemArchitectureData['nodes'],
        edges: s.edges as SystemArchitectureData['edges'],
      })
    );
  }

  for (const v of videos) {
    docs.push({
      kind: 'video',
      title: `Video: ${v.title}`,
      url: youtubeWatchUrl(v.youtubeId),
      summary: v.description,
      keywords: v.category,
      body: `Category: ${v.category}. Watch on YouTube: ${youtubeWatchUrl(v.youtubeId)} — also listed on /videos.\n${v.description}`,
    });
  }

  docs.push(exploringDoc());

  if (milestones.length > 0) {
    docs.push({
      kind: 'page',
      title: 'Changelog — career milestones',
      url: '/',
      summary: 'Milestones by year, from the home page.',
      keywords: 'milestones, timeline, changelog, career',
      body: milestones.map((m) => `- ${m.year}: ${m.title} — ${m.description}`).join('\n'),
    });
  }

  return docs;
}

/** Cached across requests and instances; admin edits invalidate it via KNOWLEDGE_TAG. */
export const getKnowledge = unstable_cache(buildKnowledge, ['assistant-knowledge', 'v1'], {
  revalidate: 600,
  tags: [KNOWLEDGE_TAG],
});
