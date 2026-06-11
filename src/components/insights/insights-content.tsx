'use client';

import { useRef, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'motion/react';
import { Search, Clock, Calendar, ArrowUpRight, Sparkles } from 'lucide-react';
import type { ArticleData } from '@/lib/types';

type Article = ArticleData;

/* ─── animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const scaleFade = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

/* ─── scroll-triggered section ─── */
function Section({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─── format date ─── */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/* ─── featured article card ─── */
function FeaturedArticleCard({
  article,
  index,
}: {
  article: Article;
  index: number;
}) {
  return (
    <motion.div
      variants={scaleFade}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link
        href={`/insights/${article.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:scale-[1.01] hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
      >
        {/* gradient header */}
        <div className="relative flex h-44 items-end bg-gradient-to-br from-primary/12 via-primary/5 to-transparent p-8">
          <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium text-primary">Featured</span>
          </div>
          <div className="absolute right-4 bottom-4">
            <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {article.category}
          </span>
        </div>

        {/* content */}
        <div className="flex flex-1 flex-col p-8">
          <h3 className="text-xl font-display font-semibold leading-snug tracking-tight md:text-2xl">
            {article.title}
          </h3>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {article.excerpt}
          </p>

          {/* meta */}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {article.readingTime} min read
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(article.publishedAt)}
            </span>
          </div>

          {/* tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── standard article card ─── */
function ArticleCard({
  article,
  index,
}: {
  article: Article;
  index: number;
}) {
  return (
    <motion.div
      variants={scaleFade}
      transition={{ duration: 0.5, delay: index * 0.06 }}
    >
      <Link
        href={`/insights/${article.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:scale-[1.01] hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
      >
        <div className="flex flex-1 flex-col p-6 md:p-7">
          {/* category */}
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-primary">
            {article.category}
          </span>

          {/* title */}
          <h3 className="mt-3 text-xl font-display font-semibold leading-snug tracking-tight">
            {article.title}
          </h3>

          {/* excerpt */}
          <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {article.excerpt}
          </p>

          {/* bottom meta */}
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {article.readingTime} min
            </span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>{formatDate(article.publishedAt)}</span>
          </div>

          {/* tags */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                +{article.tags.length - 3}
              </span>
            )}
          </div>

          {/* read link */}
          <div className="mt-5 flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
            Read Article
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   INSIGHTS CONTENT
   ═══════════════════════════════════════════════════════ */
export function InsightsContent({
  articles,
  categories,
}: {
  articles: Article[];
  categories: string[];
}) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  /* filtered articles */
  const filtered = useMemo(() => {
    let results = articles;

    if (activeCategory !== 'All') {
      results = results.filter((a) => a.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return results;
  }, [activeCategory, searchQuery, articles]);

  const featuredArticles = useMemo(
    () => filtered.filter((a) => a.featured),
    [filtered]
  );
  const allArticles = useMemo(
    () => filtered.filter((a) => !a.featured),
    [filtered]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── background effects ── */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-primary/8 via-transparent to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-blue-500/5 via-transparent to-transparent blur-3xl" />
      </div>

      {/* ── page header ── */}
      <Section className="mx-auto w-full max-w-7xl px-6 pt-32 pb-10 lg:px-8">
        <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Blog &amp; Articles
          </span>
          <h1 className="mt-4 text-5xl font-display font-bold tracking-tight">
            Insights
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Engineering notes, technical deep-dives, and thoughts on building
            intelligent systems.
          </p>
        </motion.div>

        {/* ── search ── */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 max-w-xl"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles by title, topic, or tag…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 pl-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>
        </motion.div>

        {/* ── category filter pills ── */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-6 flex flex-wrap items-center gap-2.5"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                activeCategory === category
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>
      </Section>

      {/* ── featured articles ── */}
      {featuredArticles.length > 0 && (
        <Section className="mx-auto w-full max-w-7xl px-6 pb-12 lg:px-8">
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Featured
            </h2>
          </motion.div>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            {featuredArticles.map((article, i) => (
              <FeaturedArticleCard
                key={article.slug}
                article={article}
                index={i}
              />
            ))}
          </div>
        </Section>
      )}

      {/* ── all articles grid ── */}
      <Section className="mx-auto w-full max-w-7xl px-6 pb-32 lg:px-8">
        {allArticles.length > 0 && (
          <>
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
              <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                All Articles
              </h2>
            </motion.div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {allArticles.map((article, i) => (
                <ArticleCard
                  key={article.slug}
                  article={article}
                  index={i}
                />
              ))}
            </div>
          </>
        )}

        {/* empty state */}
        {filtered.length === 0 && (
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="mt-6 text-lg font-semibold">No articles found</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Try adjusting your search or filter to find what you&apos;re
              looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
              }}
              className="mt-6 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </Section>
    </div>
  );
}
