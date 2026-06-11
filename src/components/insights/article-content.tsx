'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Share2,
  Link2,
} from 'lucide-react';
import { LinkedinIcon as Linkedin, TwitterIcon as Twitter } from '@/components/icons';

type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: number;
  publishedAt: string;
  tags: string[];
  featured: boolean;
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function ArticleContent({
  article,
  relatedArticles,
}: {
  article: Article;
  relatedArticles: Article[];
}) {
  const publishDate = new Date(article.publishedAt).toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="section-padding !pb-0 pt-32">
        <div className="container-custom max-w-4xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/insights"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Insights
            </Link>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs font-medium uppercase tracking-wider text-primary">
                {article.category}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {article.readingTime} min read
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight mb-6">
              {article.title}
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              {article.excerpt}
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {publishDate}
              </div>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-muted rounded-full px-3 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Author bar */}
            <div className="flex items-center gap-4 pb-8 border-b border-border/50">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-lg font-display font-bold">
                S
              </div>
              <div>
                <p className="font-semibold">Shashi Bhushan Vijay</p>
                <p className="text-sm text-muted-foreground">
                  Software Engineer & System Designer
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Area */}
      <div className="section-padding">
        <div className="container-custom max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-12">
            {/* Main Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-card border border-border/50 rounded-2xl p-8 md:p-12 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-display font-semibold mb-3">
                    Coming Soon
                  </h2>
                  <p className="text-muted-foreground max-w-md">
                    This article is currently being written. Check back soon for
                    the full content. In the meantime, explore other insights.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Sidebar */}
            <motion.aside
              className="hidden lg:block"
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="sticky top-28 space-y-8">
                {/* Table of Contents */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Table of Contents
                  </h3>
                  <nav className="space-y-2">
                    {[
                      'Introduction',
                      'Background',
                      'Methodology',
                      'Results',
                      'Conclusion',
                    ].map((item) => (
                      <div
                        key={item}
                        className="text-sm text-muted-foreground/60 pl-3 border-l-2 border-border/30 py-1"
                      >
                        {item}
                      </div>
                    ))}
                  </nav>
                </div>

                {/* Share */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Share
                  </h3>
                  <div className="flex gap-3">
                    <button className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Twitter className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Linkedin className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Link2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>

          {/* Mobile Share */}
          <div className="lg:hidden mt-8 flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Share:</span>
            <div className="flex gap-3">
              <button className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <Linkedin className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <Link2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Articles */}
      <div className="section-padding border-t border-border/30">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-display font-semibold mb-8">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((related, index) => (
              <motion.div
                key={related.slug}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={`/insights/${related.slug}`} className="group block">
                  <div className="bg-card border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-all duration-300 h-full">
                    <span className="text-xs text-primary uppercase tracking-wider">
                      {related.category}
                    </span>
                    <h3 className="font-semibold mt-2 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {related.excerpt}
                    </p>
                    <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {related.readingTime} min
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
