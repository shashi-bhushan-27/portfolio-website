import { getPublishedArticles } from '@/lib/articles';
import { siteConfig } from '@/lib/constants';

export const revalidate = 300;

function escape(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const articles = await getPublishedArticles(50);
  const site = siteConfig.url;

  const items = articles
    .map((a) => {
      const link = `${site}/insights/${a.slug}`;
      return `    <item>
      <title>${escape(a.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
      <description>${escape(a.excerpt)}</description>
      <category>${escape(a.category)}</category>
${a.tags.map((t) => `      <category>${escape(t)}</category>`).join('\n')}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(siteConfig.name)} — Insights</title>
    <link>${site}/insights</link>
    <atom:link href="${site}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escape('Engineering notes and technical deep-dives on software engineering, system design, ML, and AI.')}</description>
    <language>en</language>
    ${articles[0] ? `<lastBuildDate>${new Date(articles[0].updatedAt).toUTCString()}</lastBuildDate>` : ''}
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
