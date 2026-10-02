import type { Howl as HowlType } from 'howler';

/**
 * Game sound through Howler, which only downloads once the player turns sound on.
 * Every failure (blocked autoplay, missing file, no Web Audio) degrades to silence.
 */

export type SoundName =
  | 'step'
  | 'interact'
  | 'blip'
  | 'quest'
  | 'achievement'
  | 'xp'
  | 'hit'
  | 'miss'
  | 'click'
  | 'unlock';
type MusicName = 'ambient' | 'boss';

const SOUNDS: Record<SoundName, number> = {
  step: 0.12,
  interact: 0.4,
  blip: 0.18,
  quest: 0.5,
  achievement: 0.5,
  xp: 0.3,
  hit: 0.5,
  miss: 0.4,
  click: 0.3,
  unlock: 0.5,
};
const MUSIC: Record<MusicName, number> = { ambient: 0.22, boss: 0.28 };

let howls: Partial<Record<SoundName | MusicName, HowlType>> = {};
let loading: Promise<void> | null = null;
let enabled = false;
let currentMusic: MusicName | null = null;
let wantedMusic: MusicName = 'ambient';

const src = (name: string) => [`/game/audio/${name}.wav`];

function load() {
  loading ??= import('howler')
    .then(({ Howl }) => {
      const make = (name: SoundName | MusicName, volume: number, loop = false) =>
        new Howl({
          src: src(name),
          volume,
          loop,
          preload: true,
          onloaderror: () => console.warn(`[shashi.exe] sound failed to load: ${name}`),
        });
      howls = {};
      for (const [name, volume] of Object.entries(SOUNDS)) howls[name as SoundName] = make(name as SoundName, volume);
      for (const [name, volume] of Object.entries(MUSIC)) howls[name as MusicName] = make(name as MusicName, volume, true);
    })
    .catch((error) => {
      console.warn('[shashi.exe] audio unavailable', error);
      loading = null;
    });
  return loading;
}

function syncMusic() {
  if (!enabled) {
    if (currentMusic) howls[currentMusic]?.stop();
    currentMusic = null;
    return;
  }
  if (currentMusic === wantedMusic) return;
  if (currentMusic) howls[currentMusic]?.fade(MUSIC[currentMusic], 0, 400);
  const prev = currentMusic;
  setTimeout(() => prev && prev !== wantedMusic && howls[prev]?.stop(), 450);
  const next = howls[wantedMusic];
  if (next) {
    next.volume(0);
    next.play();
    next.fade(0, MUSIC[wantedMusic], 600);
  }
  currentMusic = wantedMusic;
}

export const audio = {
  /** Call from a user gesture (a click or key press) so browsers allow playback. */
  async setEnabled(on: boolean) {
    enabled = on;
    if (!on) {
      syncMusic();
      return;
    }
    await load();
    syncMusic();
  },
  play(name: SoundName) {
    if (!enabled) return;
    try {
      howls[name]?.play();
    } catch {
      // Silence is an acceptable failure mode.
    }
  },
  music(name: MusicName) {
    wantedMusic = name;
    if (enabled) syncMusic();
  },
  stopAll() {
    enabled = false;
    for (const h of Object.values(howls)) h?.stop();
    currentMusic = null;
  },
};
