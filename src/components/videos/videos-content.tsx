'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, Play } from 'lucide-react';
import type { VideoData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/lib/constants';

function Player({ video, large = false }: { video: VideoData; large?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const thumb = `https://i.ytimg.com/vi/${video.youtubeId}/${large ? 'maxresdefault' : 'hqdefault'}.jpg`;

  return (
    <div className="group relative aspect-video overflow-hidden border border-line bg-surface">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play ${video.title}`}
          className="absolute inset-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb}
            alt=""
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.src.includes('hqdefault')) img.src = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
            }}
            className="absolute inset-0 h-full w-full object-cover opacity-90 grayscale-[35%] transition-[transform,filter,opacity] duration-700 group-hover:scale-[1.02] group-hover:opacity-100 group-hover:grayscale-0"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <span
            className={cn(
              'absolute bottom-4 left-4 flex items-center gap-2 rounded-[3px] bg-signal pr-3 pl-2.5 text-on-signal transition-transform group-hover:-translate-y-0.5',
              large ? 'h-10 text-sm' : 'h-8 text-[13px]'
            )}
          >
            <Play className="size-3.5 fill-current" />
            Play
          </span>
        </button>
      )}
    </div>
  );
}

function Meta({ video, large = false }: { video: VideoData; large?: boolean }) {
  return (
    <div className="mt-4">
      <p className="label-mono flex gap-3 text-fg-faint">
        <span>{video.category}</span>
        {video.featured && <span className="text-signal-ink">featured</span>}
      </p>
      <h3
        className={cn(
          'mt-2 font-medium tracking-[-0.015em] text-fg text-balance',
          large ? 'text-2xl' : 'text-[17px] leading-snug'
        )}
      >
        {video.title}
      </h3>
      <p className={cn('mt-2 leading-relaxed text-fg-muted', large ? 'max-w-2xl' : 'line-clamp-2 text-sm')}>
        {video.description}
      </p>
      <a
        href={`https://youtu.be/${video.youtubeId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="label-mono mt-3 inline-flex items-center gap-1 text-fg-muted hover:text-fg"
      >
        YouTube <ArrowUpRight className="size-3" />
      </a>
    </div>
  );
}

export function VideosContent({ videos }: { videos: VideoData[] }) {
  const [category, setCategory] = useState('All');

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of videos) counts.set(v.category, (counts.get(v.category) ?? 0) + 1);
    return [['All', videos.length] as const, ...counts.entries()];
  }, [videos]);

  const filtered = category === 'All' ? videos : videos.filter((v) => v.category === category);
  const [lead, ...rest] = filtered;

  return (
    <div className="container-page">
      <div className="-mx-1 flex flex-wrap gap-1 border-y border-line py-4" role="tablist" aria-label="Filter by topic">
        {categories.map(([name, count]) => (
          <button
            key={name}
            role="tab"
            aria-selected={category === name}
            onClick={() => setCategory(name)}
            className={cn(
              'rounded-[4px] px-2.5 py-1.5 text-[13px] transition-colors',
              category === name ? 'bg-fg text-bg' : 'text-fg-muted hover:bg-surface hover:text-fg'
            )}
          >
            {name}
            <span className={cn('ml-1.5 font-mono text-[11px]', category === name ? 'opacity-60' : 'text-fg-faint')}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {lead ? (
        <>
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-end">
            <Player key={lead.id} video={lead} large />
            <Meta video={lead} large />
          </div>
          {rest.length > 0 && (
            <ul className="mt-16 grid gap-x-6 gap-y-12 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((v) => (
                <li key={v.id}>
                  <Player video={v} />
                  <Meta video={v} />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="py-20 text-center text-fg-muted">No videos in this category yet.</p>
      )}

      <div className="mt-20 flex flex-wrap items-center justify-between gap-6 border border-line p-6 sm:p-8">
        <div>
          <p className="label-mono text-fg-faint">Channel</p>
          <p className="mt-2 max-w-md text-fg-muted">
            New walkthroughs on distributed systems, network internals, and engineering
            fundamentals.
          </p>
        </div>
        <a
          href={siteConfig.links.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-[4px] border border-border px-4 text-sm text-fg transition-colors hover:border-fg-faint hover:bg-surface"
        >
          @shashibhushan3596
          <ArrowUpRight className="size-4" />
        </a>
      </div>
    </div>
  );
}
