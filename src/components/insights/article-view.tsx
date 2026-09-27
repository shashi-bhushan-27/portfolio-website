import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Markdown } from '@/components/markdown/markdown';
import {
  ReadingProgress,
  ShareLinks,
  TableOfContents,
} from '@/components/insights/article-islands';
import { siteConfig } from '@/lib/constants';
import { extractToc, slugify } from '@/lib/markdown';
import type { ArticleData, ArticleSummary } from '@/lib/types';
import { formatDate } from '@/lib/utils';

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-l border-line px-4 py-3 first:border-l-0 first:pl-0">
      <dt className="label-mono text-fg-faint">{label}</dt>
      <dd className="mt-1 text-sm text-fg">{children}</dd>
    </div>
  );
}

export function ArticleView({
  article,
  related = [],
}: {
  article: ArticleData;
  related?: ArticleSummary[];
}) {
  const body = article.content?.trim() || '_This article has no body yet._';
  const toc = extractToc(body);
  const url = `${siteConfig.url}/insights/${article.slug}`;
  const updated =
    new Date(article.updatedAt).getTime() - new Date(article.publishedAt).getTime() >
    1000 * 60 * 60 * 24 * 2;

  return (
    <article>
      <ReadingProgress />

      <header className="container-page pt-28 sm:pt-36">
        <nav className="label-mono flex items-center gap-2 text-fg-faint" aria-label="Breadcrumb">
          <Link href="/insights" className="group inline-flex items-center gap-1.5 hover:text-fg">
            <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" />
            insights
          </Link>
          <span>/</span>
          <span>{slugify(article.category)}</span>
        </nav>

        <h1 className="mt-8 max-w-4xl text-[clamp(2.1rem,5vw,3.9rem)] font-medium leading-[1.05] tracking-[-0.04em] text-fg text-balance">
          {article.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted text-pretty">
          {article.excerpt}
        </p>

        <dl className="mt-10 flex flex-wrap border-y border-line">
          <Spec label="Published">
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          </Spec>
          {updated && (
            <Spec label="Updated">
              <time dateTime={article.updatedAt}>{formatDate(article.updatedAt)}</time>
            </Spec>
          )}
          <Spec label="Reading">{article.readingTime} min</Spec>
          <Spec label="Filed under">{article.category}</Spec>
        </dl>

        {article.coverImage && (
          <div className="relative mt-10 aspect-[2/1] overflow-hidden border border-line bg-surface">
            <Image
              src={article.coverImage}
              alt=""
              fill
              priority
              sizes="(min-width: 1280px) 1216px, 100vw"
              className="object-cover"
            />
          </div>
        )}
      </header>

      <div className="container-page mt-14 grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_10rem]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-10">
            <TableOfContents items={toc} />
            <div>
              <p className="label-mono mb-3 text-fg-faint">Share</p>
              <ShareLinks title={article.title} url={url} />
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          {toc.length > 0 && (
            <details className="mb-10 border border-line lg:hidden">
              <summary className="label-mono cursor-pointer px-4 py-3 text-fg-muted">
                Contents · {toc.length} sections
              </summary>
              <ol className="border-t border-line px-4 py-3 text-sm">
                {toc.map((t) => (
                  <li key={t.id} className={t.depth === 3 ? 'pl-4' : ''}>
                    <a href={`#${t.id}`} className="block py-1 text-fg-muted hover:text-fg">
                      {t.text}
                    </a>
                  </li>
                ))}
              </ol>
            </details>
          )}

          <div id="article-body" className="max-w-[68ch]">
            <Markdown source={body} />
          </div>

          {article.tags.length > 0 && (
            <ul className="mt-14 flex max-w-[68ch] flex-wrap gap-1.5 border-t border-line pt-6">
              {article.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-[3px] border border-line px-2 py-1 font-mono text-[11px] text-fg-muted"
                >
                  #{slugify(tag)}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-10 flex max-w-[68ch] flex-col gap-6 border border-line p-5 sm:flex-row sm:items-center">
            <Image
              src={siteConfig.portrait}
              alt={siteConfig.name}
              width={56}
              height={56}
              className="size-14 rounded-[3px] object-cover grayscale"
            />
            <div className="flex-1">
              <p className="text-[15px] font-medium text-fg">{siteConfig.name}</p>
              <p className="text-sm text-fg-muted">{siteConfig.role}</p>
            </div>
            <div className="lg:hidden">
              <ShareLinks title={article.title} url={url} />
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-page mt-28" aria-label="Related reading">
          <div className="flex items-baseline justify-between border-t border-line pt-5">
            <h2 className="label-mono text-fg-faint">Keep reading</h2>
            <Link href="/insights" className="label-mono text-fg-muted hover:text-fg">
              All articles
            </Link>
          </div>
          <ul className="mt-6 grid gap-px md:grid-cols-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/insights/${r.slug}`}
                  className="group flex h-full flex-col border border-line p-5 transition-colors hover:border-border hover:bg-surface"
                >
                  <span className="label-mono text-fg-faint">{r.category}</span>
                  <span className="mt-4 font-medium leading-snug text-fg text-balance">
                    {r.title}
                  </span>
                  <span className="label-mono mt-auto flex items-center justify-between pt-6 text-fg-faint">
                    {r.readingTime} min
                    <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
