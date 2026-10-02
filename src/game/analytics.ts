import { track } from '@vercel/analytics';

/**
 * Anonymous product events for the game — what people open, never who they are.
 * Sent through the site's existing Vercel Analytics; no ids, no free text.
 */
export type GameEvent =
  | 'game_started'
  | 'game_completed'
  | 'ai_lab_entered'
  | 'project_opened'
  | 'dsa_started'
  | 'dsa_completed'
  | 'interview_started'
  | 'interview_completed'
  | 'easter_egg_found'
  | 'recruiter_mode_opened'
  | 'resume_clicked'
  | 'github_clicked'
  | 'linkedin_clicked'
  | 'contact_clicked';

const sentOnce = new Set<string>();

export function trackGame(
  event: GameEvent,
  props?: Record<string, string | number | boolean>,
  opts: { once?: boolean } = {}
) {
  const key = `${event}:${JSON.stringify(props ?? {})}`;
  if (opts.once) {
    if (sentOnce.has(key)) return;
    sentOnce.add(key);
  }
  try {
    track(event, props);
  } catch {
    // Analytics must never break the game.
  }
}
