'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { Play, ExternalLink } from 'lucide-react';
import type { VideoData } from '@/lib/types';

/* ─── Inline YouTube SVG logo (lucide-react doesn't ship this icon) ─── */
function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}


/* ─── Category colour mapping ─── */
const categoryStyle: Record<string, { accent: string; pill: string; glow: string }> = {
  'Distributed Systems': {
    accent: 'text-violet-400',
    pill: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    glow: 'hover:shadow-[0_0_28px_-4px_rgba(167,139,250,0.2)]',
  },
  'Network Security': {
    accent: 'text-red-400',
    pill: 'bg-red-500/10 text-red-400 border-red-500/20',
    glow: 'hover:shadow-[0_0_28px_-4px_rgba(248,113,113,0.2)]',
  },
  'Systems Programming': {
    accent: 'text-cyan-400',
    pill: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    glow: 'hover:shadow-[0_0_28px_-4px_rgba(34,211,238,0.2)]',
  },
  'IoT & Infrastructure': {
    accent: 'text-emerald-400',
    pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    glow: 'hover:shadow-[0_0_28px_-4px_rgba(52,211,153,0.2)]',
  },
};

const defaultStyle = {
  accent: 'text-primary',
  pill: 'bg-primary/10 text-primary border-primary/20',
  glow: 'hover:shadow-[0_0_28px_-4px_rgba(251,146,60,0.2)]',
};

/* ─── Single Video Card ─── */
function VideoCard({ video, index }: { video: VideoData; index: number }) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const style = categoryStyle[video.category] ?? defaultStyle;
  const thumbUrl = `https://i.ytimg.com/vi/${video.youtubeId}/maxresdefault.jpg`;
  const fallbackThumbUrl = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: index * 0.07 }}
      className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-500 hover:border-border ${style.glow}`}
    >
      {/* Featured badge */}
      {video.featured && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-primary-foreground animate-pulse" />
          Featured
        </div>
      )}

      {/* ── Video / Thumbnail area ── */}
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {playing ? (
          /* Embedded iframe — only mounts after click */
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1&color=white`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          /* Facade thumbnail — lightweight until user clicks */
          <>
            {/* Thumbnail image with fallback */}
            <img
              src={thumbUrl}
              alt={video.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackThumbUrl;
              }}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/30 transition-opacity duration-300 group-hover:bg-black/20" />

            {/* Subtle scanlines for engineering aesthetic */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)',
              }}
            />

            {/* Play button */}
            <button
              onClick={() => setPlaying(true)}
              aria-label={`Play: ${video.title}`}
              className="absolute inset-0 flex items-center justify-center"
            >
              <motion.div
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-xl transition-colors duration-300 hover:bg-white/20"
              >
                <Play className="h-6 w-6 fill-white text-white translate-x-0.5" />
              </motion.div>
            </button>

            {/* YouTube logo watermark */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 backdrop-blur-sm">
              <YoutubeIcon className="h-3 w-3 text-red-500" />
              <span className="text-[10px] font-mono text-white/70">YouTube</span>
            </div>
          </>
        )}
      </div>

      {/* ── Card metadata ── */}
      <div className="p-5">
        {/* Category pill */}
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style.pill}`}
        >
          {video.category}
        </span>

        {/* Title */}
        <h3 className="mt-3 text-base font-semibold leading-snug tracking-tight text-foreground line-clamp-2">
          {video.title}
        </h3>

        {/* Description */}
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {video.description}
        </p>

        {/* Footer actions */}
        <div className="mt-4 flex items-center justify-between border-t border-border/30 pt-4">
          <button
            onClick={() => setPlaying(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Play className="h-3 w-3" />
            Watch now
          </button>
          <a
            href={`https://youtu.be/${video.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            aria-label="Open on YouTube"
          >
            <ExternalLink className="h-3 w-3" />
            YouTube
          </a>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   VIDEOS GALLERY PAGE CONTENT
   ═══════════════════════════════════════════════════════ */
export function VideosContent({ videos }: { videos: VideoData[] }) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' });

  /* Build category filter list */
  const categories = ['All', ...Array.from(new Set(videos.map((v) => v.category)))];
  const filtered =
    activeCategory === 'All' ? videos : videos.filter((v) => v.category === activeCategory);

  return (
    <div className="section-padding">
      <div className="container-custom max-w-6xl">

        {/* ── Hero ── */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 32 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Eyebrow */}
          <div className="mb-4 flex items-center gap-2">
            <YoutubeIcon className="h-4 w-4 text-red-500" />
            <span className="text-xs font-mono font-medium uppercase tracking-widest text-muted-foreground">
              Video Library
            </span>
          </div>

          <h1 className="font-display text-5xl font-bold tracking-tight">
            Talks &amp; Demos
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Engineering walkthroughs, system design explorations, and hands-on
            demonstrations — published on{' '}
            <a
              href="https://www.youtube.com/@shashibhushan3596"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              YouTube
            </a>
            .
          </p>
        </motion.div>

        {/* ── Category Filter Pills ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap gap-2"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              {cat}
              {cat === 'All' && (
                <span className="ml-1.5 text-[10px] opacity-60">({videos.length})</span>
              )}
            </button>
          ))}
        </motion.div>

        {/* ── Video Grid ── */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((video, i) => (
            <VideoCard key={video.id} video={video} index={i} />
          ))}
        </div>

        {/* ── Empty state ── */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-20 text-center text-muted-foreground"
          >
            No videos in this category yet.
          </motion.div>
        )}

        {/* ── Channel CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 flex flex-col items-center gap-4 rounded-2xl border border-border/50 bg-card/40 p-10 text-center backdrop-blur-sm"
        >
          <YoutubeIcon className="h-8 w-8 text-red-500" />
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            More content on YouTube
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Subscribe to the channel for new walkthroughs on distributed systems,
            network internals, and engineering fundamentals.
          </p>
          <a
            href="https://www.youtube.com/@shashibhushan3596"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            <YoutubeIcon className="h-4 w-4" />
            Visit Channel
          </a>
        </motion.div>

      </div>
    </div>
  );
}
