/**
 * Synthesizes the SHASHI.EXE sounds into public/game/audio/ as 16-bit mono WAV.
 * Nothing is sampled or licensed — every sound is a few oscillators and envelopes.
 *
 *   npm run game:assets
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(__dirname, '..', 'public', 'game', 'audio');

type Wave = (phase: number) => number;
const sine: Wave = (p) => Math.sin(2 * Math.PI * p);
const square: Wave = (p) => (p % 1 < 0.5 ? 1 : -1);
const triangle: Wave = (p) => 1 - 4 * Math.abs((p % 1) - 0.5);

/** Deterministic noise, so rebuilding gives byte-identical files. */
let seed = 1;
const noise = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed / 2147483647) * 2 - 1;
};

const note = (n: string) => {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const [, name, oct] = n.match(/^([A-G]#?)(\d)$/)!;
  return 440 * 2 ** ((names.indexOf(name) - 9) / 12 + (Number(oct) - 4));
};

class Track {
  readonly data: Float32Array;
  constructor(
    readonly rate: number,
    seconds: number
  ) {
    this.data = new Float32Array(Math.round(rate * seconds));
  }

  /** A tone with an attack/decay envelope; `freq` may glide from → to. */
  tone(
    start: number,
    length: number,
    freq: number | [number, number],
    wave: Wave,
    volume: number,
    { attack = 0.004, release = 0.6, loop = false }: { attack?: number; release?: number; loop?: boolean } = {}
  ) {
    const [f0, f1] = Array.isArray(freq) ? freq : [freq, freq];
    const s0 = Math.round(start * this.rate);
    const n = Math.round(length * this.rate);
    let phase = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const f = f0 + (f1 - f0) * t;
      phase += f / this.rate;
      const env = Math.min(1, i / (attack * this.rate)) * (t < 1 - release ? 1 : (1 - t) / release);
      const idx = loop ? (s0 + i) % this.data.length : s0 + i;
      if (idx < this.data.length) this.data[idx] += wave(phase) * volume * env;
    }
  }

  noise(start: number, length: number, volume: number, smooth = 0.6) {
    const s0 = Math.round(start * this.rate);
    const n = Math.round(length * this.rate);
    let prev = 0;
    for (let i = 0; i < n && s0 + i < this.data.length; i++) {
      prev = prev * smooth + noise() * (1 - smooth);
      this.data[s0 + i] += prev * volume * (1 - i / n);
    }
  }

  wav() {
    const n = this.data.length;
    const buf = Buffer.alloc(44 + n * 2);
    buf.write('RIFF', 0);
    buf.writeUInt32LE(36 + n * 2, 4);
    buf.write('WAVEfmt ', 8);
    buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20); // PCM
    buf.writeUInt16LE(1, 22); // mono
    buf.writeUInt32LE(this.rate, 24);
    buf.writeUInt32LE(this.rate * 2, 28);
    buf.writeUInt16LE(2, 32);
    buf.writeUInt16LE(16, 34);
    buf.write('data', 36);
    buf.writeUInt32LE(n * 2, 40);
    for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, this.data[i])) * 32767), 44 + i * 2);
    return buf;
  }
}

const SFX = 22050;
const MUSIC = 11025;
const sounds: Record<string, Track> = {};

sounds.step = (() => {
  const t = new Track(SFX, 0.05);
  t.noise(0, 0.05, 0.5, 0.85);
  return t;
})();

sounds.blip = (() => {
  const t = new Track(SFX, 0.03);
  t.tone(0, 0.03, 1200, square, 0.18, { release: 0.5 });
  return t;
})();

sounds.click = (() => {
  const t = new Track(SFX, 0.02);
  t.tone(0, 0.02, 1800, triangle, 0.4, { release: 0.8 });
  return t;
})();

sounds.interact = (() => {
  const t = new Track(SFX, 0.12);
  t.tone(0, 0.05, 660, square, 0.22);
  t.tone(0.05, 0.07, 990, square, 0.22);
  return t;
})();

sounds.xp = (() => {
  const t = new Track(SFX, 0.16);
  t.tone(0, 0.07, note('C6'), triangle, 0.35);
  t.tone(0.06, 0.1, note('E6'), triangle, 0.35);
  return t;
})();

sounds.quest = (() => {
  const t = new Track(SFX, 0.6);
  ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => t.tone(i * 0.09, 0.32, note(n), triangle, 0.32));
  t.tone(0.27, 0.33, note('C6') * 2, sine, 0.1);
  return t;
})();

sounds.achievement = (() => {
  const t = new Track(SFX, 0.75);
  ['G5', 'B5', 'D6', 'G6'].forEach((n, i) => t.tone(i * 0.07, 0.45, note(n), square, 0.12));
  ['G5', 'B5', 'D6', 'G6'].forEach((n, i) => t.tone(i * 0.07, 0.5, note(n), triangle, 0.22));
  return t;
})();

sounds.hit = (() => {
  const t = new Track(SFX, 0.2);
  t.tone(0, 0.18, [320, 110], square, 0.3);
  t.noise(0, 0.08, 0.35, 0.3);
  return t;
})();

sounds.miss = (() => {
  const t = new Track(SFX, 0.26);
  t.tone(0, 0.12, [420, 360], square, 0.18);
  t.tone(0.12, 0.14, [300, 210], square, 0.18);
  return t;
})();

sounds.unlock = (() => {
  const t = new Track(SFX, 0.55);
  t.tone(0, 0.22, [200, 900], triangle, 0.25);
  ['E5', 'A5', 'C#6'].forEach((n) => t.tone(0.2, 0.35, note(n), triangle, 0.18));
  return t;
})();

/** A soft four-chord loop (Am7 – Fmaj7 – C – G), 2 s per chord. */
sounds.ambient = (() => {
  const bar = 2;
  const t = new Track(MUSIC, bar * 4);
  const chords = [
    ['A3', 'C4', 'E4', 'G4'],
    ['F3', 'A3', 'C4', 'E4'],
    ['C3', 'E3', 'G3', 'C4'],
    ['G3', 'B3', 'D4', 'F#4'],
  ];
  chords.forEach((chord, b) => {
    const at = b * bar;
    chord.forEach((n) => t.tone(at, bar, note(n), triangle, 0.06, { attack: 0.35, release: 0.45 }));
    t.tone(at, bar, note(chord[0]) / 2, sine, 0.12, { attack: 0.05, release: 0.5 });
    // A gentle arpeggio on top, in eighths.
    for (let k = 0; k < 8; k++) {
      t.tone(at + k * (bar / 8), 0.22, note(chord[k % 4]) * 2, sine, 0.05, { attack: 0.005, release: 0.9 });
    }
  });
  return t;
})();

/** A tense two-bar ostinato for the final round. */
sounds.boss = (() => {
  const beat = 0.25;
  const t = new Track(MUSIC, beat * 16);
  const bass = ['A2', 'A2', 'C3', 'A2', 'E3', 'A2', 'D3', 'C3'];
  for (let i = 0; i < 16; i++) {
    t.tone(i * beat, beat * 0.9, note(bass[i % 8]), square, 0.07, { release: 0.5 });
    if (i % 4 === 0) t.noise(i * beat, 0.08, 0.22, 0.7);
    if (i % 4 === 2) t.noise(i * beat, 0.04, 0.12, 0.2);
  }
  ['A4', 'C5', 'E5', 'D5'].forEach((n, i) => t.tone(i * beat * 4, beat * 3.5, note(n), triangle, 0.05, { attack: 0.05 }));
  return t;
})();

fs.mkdirSync(OUT, { recursive: true });
console.log('SHASHI.EXE audio →');
let total = 0;
for (const [name, track] of Object.entries(sounds)) {
  const file = path.join(OUT, `${name}.wav`);
  const wav = track.wav();
  fs.writeFileSync(file, wav);
  total += wav.length;
  console.log(`  public/game/audio/${name}.wav  ${(wav.length / 1024).toFixed(1)} KB`);
}
console.log(`  total ${(total / 1024).toFixed(0)} KB (loaded only after sound is turned on)`);
