/**
 * YouTube helpers shared by the admin (browser + server actions) and the public Videos page.
 */

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extract the 11-character video ID from anything people paste:
 * a bare ID, youtu.be/…, youtube.com/watch?v=…, /embed/…, /shorts/…, /live/…,
 * m./music. subdomains and youtube-nocookie.com. Returns null if it isn't one.
 */
export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (VIDEO_ID.test(s)) return s;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^(www|m|music)\./, '');
  let id: string | null = null;

  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else id = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)?.[1] ?? null;
  }

  return id && VIDEO_ID.test(id) ? id : null;
}

export function youtubeThumbnail(id: string, quality: 'mq' | 'hq' | 'maxres' = 'hq') {
  return `https://i.ytimg.com/vi/${id}/${quality}default.jpg`;
}

export function youtubeWatchUrl(id: string) {
  return `https://youtu.be/${id}`;
}
