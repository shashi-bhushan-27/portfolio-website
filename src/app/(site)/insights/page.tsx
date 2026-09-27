import type { Metadata } from 'next';
import { getPublishedArticles } from '@/lib/articles';
import { InsightsContent } from '@/components/insights/insights-content';
import { PageHeader } from '@/components/ui/section-header';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Insights',
  description:
    'Engineering notes, technical deep-dives, and insights on software engineering, system design, ML, and AI.',
};

export default async function InsightsPage() {
  const articles = await getPublishedArticles();
  const minutes = articles.reduce((n, a) => n + a.readingTime, 0);

  return (
    <>
      <PageHeader
        path="insights"
        title="Insights"
        description="Engineering notes, technical deep-dives, and thoughts on building intelligent systems."
        meta={
          <>
            {articles.length} articles · ~{minutes} min of reading ·{' '}
            <a href="/feed.xml" className="link-underline hover:text-fg">
              RSS
            </a>
          </>
        }
      />
      <InsightsContent articles={articles} />
    </>
  );
}
