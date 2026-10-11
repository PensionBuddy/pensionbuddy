#!/usr/bin/env node
/* The launch video's soundtrack, synthesised from nothing: no samples, no
   packages.

       node tools/launch-video/audio.mjs

   Everything is placed from timeline.mjs, the same cue list the pictures
   use, so a coin's clink and the coin's landing are the same number. Music:
   96 BPM, G and A into the drop, then D Bm G A; a pitch-dropping sine kick,
   a shaped-noise clap, high-passed noise hats, a bass, a warm detuned pad, a
   Karplus-Strong pluck and an FM bell lead. Effects: risers and whooshes that
   end exactly on their cuts, pops for the paw's toes, ticks for letters,
   clinks for coins, blips for the jargon's scramble.

   Mastering: a BS.1770-4 meter (K-weighting, 400 ms blocks, absolute and
   relative gates) and a 4x-oversampled true-peak meter, written here, set the
   gain and a look-ahead limiter's ceiling so the mix sits at -14 LUFS
   integrated and under -1 dBTP. Then ffmpeg's loudnorm, two passes (measure,
   then apply in linear mode), does the official normalisation, and its
   figures are printed.

   Writes to $LV_WORK/audio/: mix.wav (48 kHz, 16-bit stereo, written by this
   script) and master.wav (after loudnorm), and loudness.json. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { WORK } from './lib.mjs';
import * as TL from './timeline.mjs';

const SR = 48000, N = Math.round(TL.DURATION * SR), BEAT = TL.BEAT;
const dir = join(WORK, 'audio'); mkdirSync(dir, { recursive: true });

/* ---- buses ---- */
const bus = () => [new Float32Array(N), new Float32Array(N)];
const B = { drums: bus(), bass: bus(), pad: bus(), pluck: bus(), lead: bus(), sfx: bus(), verb: bus(), echo: bus() };
function put(b, t0, fn, len, panv = 0, gain = 1, send = 0, sendBus = B.verb) {
  const s0 = Math.round(t0 * SR), n = Math.round(len * SR);
  const gl = gain * Math.cos((panv + 1) * Math.PI / 4) * Math.SQRT2, gr = gain * Math.sin((panv + 1) * Math.PI / 4) * Math.SQRT2;
  for (let i = 0; i < n; i++) {
    const k = s0 + i; if (k < 0 || k >= N) continue;
    const v = fn(i / SR, i);
    b[0][k] += v * gl; b[1][k] += v * gr;
    if (send) { sendBus[0][k] += v * gl * send; sendBus[1][k] += v * gr * send; }
  }
}
/* deterministic noise */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1; }; }
const R = rng(20261011);
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
/* a biquad, RBJ cookbook */
function biquad(type, f, q) {
  const w = 2 * Math.PI * f / SR, c = Math.cos(w), s = Math.sin(w), al = s / (2 * q);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; }
  else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; }
  else { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; }
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const st = { set(f2) { const w2 = 2 * Math.PI * f2 / SR, c2 = Math.cos(w2), s2 = Math.sin(w2), al2 = s2 / (2 * q);
      if (type === 'bp') { b0 = al2; b1 = 0; b2 = -al2; a0 = 1 + al2; a1 = -2 * c2; a2 = 1 - al2; }
      else if (type === 'hp') { b0 = (1 + c2) / 2; b1 = -(1 + c2); b2 = (1 + c2) / 2; a0 = 1 + al2; a1 = -2 * c2; a2 = 1 - al2; }
      else { b0 = (1 - c2) / 2; b1 = 1 - c2; b2 = (1 - c2) / 2; a0 = 1 + al2; a1 = -2 * c2; a2 = 1 - al2; } },
    run(x) { const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; } };
  return st;
}

/* ---- the kit ---- */
const KICKS = [];
function kick(t0, vel = 1) {
  KICKS.push(t0);
  put(B.drums, t0, t => {
    const ph = 2 * Math.PI * (54 * t + 130 * 0.03 * (1 - Math.exp(-t / 0.03)));
    const env = Math.min(1, t / 0.0015) * Math.exp(-t / 0.2);
    return Math.sin(ph) * env * vel + (t < 0.004 ? R() * 0.25 * (1 - t / 0.004) * vel : 0);
  }, 0.6, 0, 0.95);
}
function clap(t0, vel = 1) {
  const f = biquad('bp', 1400, 0.9), f2 = biquad('bp', 1600, 0.9);
  const env = t => (t < 0.03 ? [0, 0.011, 0.022].reduce((a, o) => a + (t >= o ? Math.exp(-(t - o) / 0.007) : 0), 0) * 0.7 : 0) + (t >= 0.022 ? Math.exp(-(t - 0.022) / 0.10) : 0);
  put(B.drums, t0, t => f.run(R()) * env(t) * vel, 0.5, -0.12, 0.55, 0.25);
  put(B.drums, t0, t => f2.run(R()) * env(t) * vel, 0.5, 0.12, 0.55, 0.25);
}
function hat(t0, vel = 1, open = false, pan = 0.25) {
  const f = biquad('hp', 7500, 0.7), f2 = biquad('hp', 7500, 0.7);
  put(B.drums, t0, t => f2.run(f.run(R())) * Math.exp(-t / (open ? 0.16 : 0.022)) * vel, open ? 0.5 : 0.12, pan, 0.55);
}
function shaker(t0, vel = 1) {
  const f = biquad('bp', 6000, 1.2);
  put(B.drums, t0, t => f.run(R()) * Math.min(1, t / 0.012) * Math.exp(-t / 0.05) * vel, 0.15, -0.3, 0.22);
}
function bass(t0, dur, m, vel = 1) {
  const f = mtof(m);
  put(B.bass, t0, t => {
    const ph = 2 * Math.PI * f * t;
    const env = Math.min(1, t / 0.005) * (t > dur ? Math.exp(-(t - dur) / 0.05) : 1) * (0.85 + 0.15 * Math.exp(-t / 0.08));
    return (0.8 * Math.sin(ph) + 0.45 * Math.sin(2 * ph) + 0.22 * Math.sin(3 * ph) + 0.1 * Math.sin(4 * ph) + 0.05 * Math.sin(5 * ph)) * env * vel;
  }, dur + 0.3, 0, 0.5);
}
/* a band-limited, warm saw as a wavetable */
const TAB = new Float32Array(4096);
for (let k = 1; k <= 28; k++) for (let i = 0; i < 4096; i++) TAB[i] += Math.sin(2 * Math.PI * k * i / 4096) / k * Math.exp(-k / 9);
const tab = ph => { const x = (ph - Math.floor(ph)) * 4096, i = x | 0, fr = x - i; return TAB[i] * (1 - fr) + TAB[(i + 1) & 4095] * fr; };
function pad(t0, dur, notes, vel = 1) {
  notes.forEach((m, j) => {
    const f = mtof(m);
    for (const [det, pan] of [[-7, -0.6], [0, 0], [6, 0.6]]) {
      const ff = f * Math.pow(2, det / 1200), lp = biquad('lp', 1800, 0.6), p0 = (j * 0.37 + det * 0.013) % 1;
      put(B.pad, t0, t => {
        const env = Math.min(1, t / 0.35) * (t > dur ? Math.exp(-(t - dur) / 0.5) : 1);
        return lp.run(tab(p0 + ff * t)) * env * vel;
      }, dur + 2.0, pan, 0.07, 0.35);
    }
  });
}
/* Karplus-Strong pluck */
function pluck(t0, m, vel = 1, pan = 0.2, len = 1.0, bright = 0.5, bus = B.pluck) {
  const f = mtof(m), P = Math.max(2, Math.round(SR / f - 0.5));
  const buf = new Float32Array(P); let prev = 0;
  for (let i = 0; i < P; i++) { const x = R(); prev = prev + bright * (x - prev); buf[i] = prev; }
  let idx = 0;
  put(bus, t0, (t) => {
    const a = buf[idx], b2 = buf[(idx + 1) % P];
    const y = 0.5 * (a + b2) * 0.9965; buf[idx] = y; idx = (idx + 1) % P;
    return a * Math.min(1, t / 0.002) * (t > len - 0.1 ? Math.max(0, (len - t) / 0.1) : 1) * vel;
  }, len, pan, 0.55, 0.18);
}
/* FM bell for the hook */
function bell(t0, m, vel = 1, pan = 0, len = 1.2, bus = B.lead, ratio = 2, idx0 = 2.2) {
  const f = mtof(m);
  put(bus, t0, t => {
    const env = Math.min(1, t / 0.003) * Math.exp(-t / 0.45);
    const I = idx0 * Math.exp(-t / 0.12);
    return (Math.sin(2 * Math.PI * f * t + I * Math.sin(2 * Math.PI * f * ratio * t)) * 0.8 + 0.25 * Math.sin(2 * Math.PI * f * 0.5 * t) * Math.exp(-t / 0.3)) * env * vel;
  }, len, pan, 0.5, 0.3, B.verb);
  put(B.echo, t0, t => Math.sin(2 * Math.PI * f * t) * Math.min(1, t / 0.003) * Math.exp(-t / 0.3) * vel * 0.5, 0.6, pan, 0.5);
}

/* ---- effects ---- */
function pop(t0, m, vel = 1, pan = 0) {
  const f = mtof(m);
  let ph = 0;
  put(B.sfx, t0, t => { const ff = f * (1 + 0.8 * Math.exp(-t / 0.012)); ph += 2 * Math.PI * ff / SR; return Math.sin(ph) * Math.min(1, t / 0.001) * Math.exp(-t / 0.09) * vel; }, 0.4, pan, 0.5, 0.25);
}
function tick(t0, f = 3000, vel = 1, pan = 0) {
  const bp = biquad('bp', f, 3);
  put(B.sfx, t0, t => (bp.run(R()) * 2.5 + Math.sin(2 * Math.PI * f * 0.5 * t) * 0.4) * Math.exp(-t / 0.012) * vel, 0.06, pan, 0.35, 0.15);
}
function noiseSweep(tEnd, len, f0, f1, vel, pan0 = -0.5, pan1 = 0.5, shape = 2, bus = B.sfx, q = 1.2) {
  const bp = biquad('bp', f0, q), bp2 = biquad('bp', f0, q);
  const t0 = tEnd - len;
  put(bus, t0, (t, i) => {
    const u = t / len, f = f0 * Math.pow(f1 / f0, u);
    if (i % 32 === 0) { bp.set(f); bp2.set(f * 1.02); }
    const env = Math.pow(u, shape) * (u > 0.97 ? (1 - u) / 0.03 : 1);
    return (bp.run(R()) + bp2.run(R())) * env * vel;
  }, len, 0, 0.6, 0.3);
}
function whoosh(tEnd, len = 0.45, vel = 1) { noiseSweep(tEnd, len, 400, 4200, 0.9 * vel, -0.6, 0.6, 2.2); }
function riser(tEnd, len) {
  noiseSweep(tEnd, len, 250, 7000, 0.75, 0, 0, 2.6, B.sfx, 2.5);
  let ph = 0;
  put(B.sfx, tEnd - len, t => { const u = t / len, f = 180 * Math.pow(5, u); ph += 2 * Math.PI * f / SR; return Math.sin(ph) * Math.pow(u, 3) * 0.25 * (u > 0.98 ? (1 - u) / 0.02 : 1); }, len, 0, 0.5, 0.2);
}
function boom(t0, vel = 1) {
  let ph = 0;
  put(B.sfx, t0, t => { const f = 38 + 30 * Math.exp(-t / 0.08); ph += 2 * Math.PI * f / SR; return Math.sin(ph) * Math.min(1, t / 0.003) * Math.exp(-t / 0.35) * vel; }, 0.9, 0, 0.6);
}
function shimmer(t0, vel = 1) {
  const hp = biquad('hp', 5000, 0.7), hp2 = biquad('hp', 5000, 0.7);
  put(B.sfx, t0, t => hp.run(R()) * Math.min(1, t / 0.004) * Math.exp(-t / 0.6) * vel, 1.6, -0.4, 0.12, 0.5);
  put(B.sfx, t0, t => hp2.run(R()) * Math.min(1, t / 0.004) * Math.exp(-t / 0.6) * vel, 1.6, 0.4, 0.12, 0.5);
}
function clink(t0, kind) {
  const f = kind === 'amber' ? 2350 : 1650, parts = [[1, 0.24, 1], [2.32, 0.12, 0.6], [4.25, 0.07, 0.35], [6.63, 0.04, 0.2]];
  put(B.sfx, t0, t => parts.reduce((a, [r, d, g]) => a + Math.sin(2 * Math.PI * f * r * t) * Math.exp(-t / d) * g, 0) * Math.min(1, t / 0.0008) * 0.6
    + Math.sin(2 * Math.PI * 170 * t) * Math.exp(-t / 0.04) * 0.5, 0.8, kind === 'amber' ? 0.25 : -0.15, 0.5, 0.2);
  if (kind === 'amber') { bell(t0 + 0.06, 93, 0.35, 0.3, 0.6, B.sfx, 3.5, 1.2); bell(t0 + 0.12, 98, 0.3, 0.4, 0.6, B.sfx, 3.5, 1.2); }
}
function photo(t0) {
  tick(t0 - 0.03, 2200, 1.4, -0.2); tick(t0, 1800, 1.4, 0.2);
  put(B.sfx, t0, t => Math.sin(2 * Math.PI * 95 * t) * Math.exp(-t / 0.07), 0.3, 0, 0.45);
  noiseSweep(t0 + 0.02, 0.22, 2500, 500, 0.35, 0.3, -0.3, 1.0);
}

/* ---- the music, on the grid ---- */
const CH = {
  G: { bass: 43, pad: [55, 59, 62, 66], arp: [67, 71, 74, 78] },
  A: { bass: 45, pad: [57, 61, 64, 71], arp: [69, 73, 76, 81] },
  D: { bass: 38, pad: [57, 62, 66, 69, 73], arp: [74, 78, 81, 86] },
  Bm: { bass: 47, pad: [59, 62, 66, 69], arp: [71, 74, 78, 81] },
};
const HOOK = {
  D: [[0, 78, .5], [0.75, 81, .5], [1.5, 83, 1], [2.5, 81, .5], [3, 78, 1]],
  Bm: [[0, 74, .5], [0.75, 78, .5], [1.5, 81, 1], [2.5, 78, .5], [3.5, 76, .5]],
  G: [[0, 74, .5], [0.75, 79, .5], [1.5, 83, 1], [2.5, 81, .5], [3, 79, 1]],
  A: [[0, 76, .5], [0.75, 81, .5], [1.5, 85, .5], [2, 83, .5], [3, 81, 1]],
};
const bt = TL.b;
const END = TL.DURATION / BEAT;   // 58 beats
const SH = id => TL.SHOTS.find(s => s.id === id);
const CALC = SH('calc').from, JAR = SH('jargon'), ENDC = SH('end').from, FINAL = (TL.CHORDS.length - 1) * 4;   // the end card; the last chord's downbeat
TL.CHORDS.forEach((name, bar) => {
  const c = CH[name], b0 = bar * 4;
  if (b0 >= END) return;
  const last = bar === TL.CHORDS.length - 1;
  /* pad all the way; the last chord rings out */
  pad(bt(b0), last ? TL.DURATION - bt(b0) - 0.2 : BEAT * 4, c.pad, bar < 2 ? 0.8 : 1);
  if (bar >= 2 && !last) {
    /* bass: root, a bounce, the octave, the fifth */
    for (const [o, iv, d] of [[0, 0, 0.9], [1.5, 0, 0.4], [2, 12, 0.35], [2.5, 0, 0.9], [3.5, 7, 0.4]]) {
      const beat = b0 + o; if (beat >= ENDC && beat < FINAL) { if (o === 0 || o === 2.5) bass(bt(beat), BEAT * 1.6, c.bass, 0.8); continue; }
      bass(bt(beat), BEAT * d, c.bass + iv, 1);
    }
    /* pluck arpeggio in eighths */
    [0, 1, 2, 3, 2, 1, 2, 3].forEach((k, j) => { const beat = b0 + j / 2; if (beat >= ENDC) return; pluck(bt(beat), c.arp[k] - 12, j % 2 ? 0.55 : 0.75, j % 2 ? 0.35 : 0.15, 0.6, 0.45); });
  }
  if (last) { bass(bt(b0), TL.DURATION - bt(b0) - 0.3, c.bass, 1); }
  /* the hook over the calculator, tax relief and the people */
  /* (not under the jargon, where the scramble's blips have the treble) */
  for (const [o, m, d] of HOOK[name]) { const beat = b0 + o; if (beat >= CALC && beat < ENDC && !(beat >= JAR.from && beat < JAR.to)) bell(bt(beat), m, 0.8, 0.1, d * BEAT + 0.8); }
});
/* intro: pad and the toes, then a pulse in bar 2 */
for (let s = 4; s < 8; s += 0.25) shaker(bt(s), s % 1 === 0 ? 0.55 : 0.3);
kick(bt(4), 0.55); kick(bt(6), 0.55);
/* drums from the drop to the end card */
for (let beat = 8; beat < ENDC; beat++) {
  const inBar = beat % 4, jargon = beat >= JAR.from && beat < JAR.to;
  if (inBar === 0 || inBar === 2) kick(bt(beat), 1);
  if (inBar === 1 && !jargon) kick(bt(beat + 0.5), 0.7);
  if (inBar === 1 || inBar === 3) clap(bt(beat), jargon ? 0.7 : 1);
  hat(bt(beat), 0.45, false, -0.2); hat(bt(beat + 0.5), jargon ? 0.6 : 0.85, !jargon && inBar === 3, 0.25);
  if (!jargon) { hat(bt(beat + 0.25), 0.25, false, 0.3); hat(bt(beat + 0.75), 0.3, false, 0.3); }
}
/* the end card: a hit as it lands, soft time, the last chord */
kick(bt(ENDC), 1); shimmer(bt(ENDC), 0.8);
for (let beat = ENDC + 1; beat < FINAL; beat++) { hat(bt(beat + 0.5), 0.5); if ((beat - ENDC) % 2 === 0) kick(bt(beat), 0.55); }
kick(bt(FINAL), 1); shimmer(bt(FINAL), 1);

/* ---- the effects, from the cue list ---- */
const TOE_NOTES = [74, 78, 81, 86];
for (const c of TL.CUES) {
  const t = c.t;
  switch (c.sfx) {
    case 'bloom': pop(Math.max(0, t), 62, 0.6); bell(Math.max(0, t), 74, 0.5, 0, 1.6, B.sfx, 2, 1.0); break;
    case 'pop': pop(t, c.id === 'end.mark' ? 74 : TOE_NOTES[c.note], 0.9, (c.note - 1.5) * 0.25); if (c.id !== 'end.mark') bell(t, TOE_NOTES[c.note] + 12, 0.25, 0, 0.8, B.sfx, 2, 0.8); break;
    case 'tick': tick(t, 2400 + c.note * 140, 0.8, -0.4 + c.note * 0.07); break;
    case 'tick2': tick(t, 3200, 0.9); pop(t, 86, 0.25); break;
    case 'swish': noiseSweep(t + 0.32, 0.4, 600, 3200, 0.4, -0.5, 0.5, 1.4); break;
    case 'sweep': noiseSweep(t + 0.45, 0.45, 1500, 7000, 0.3, -0.6, 0.6, 0.8); break;
    case 'chime': bell(t, 81, 0.55, -0.2, 1.4, B.sfx, 2, 1.5); bell(t + 0.04, 86, 0.45, 0.2, 1.4, B.sfx, 2, 1.5); break;
    case 'riser': riser(t, TL.b(c.len)); break;
    case 'drop': boom(t, 1); shimmer(t, 1); break;
    case 'cut': boom(t, 0.55); break;
    case 'whoosh-s': whoosh(t + 0.12, 0.3, 0.5); break;
    case 'grow': { let ph = 0; put(B.sfx, t - 0.12, u => { const f = 330 * Math.pow(2, Math.min(1, u / 0.35)); ph += 2 * Math.PI * f / SR; return Math.sin(ph) * Math.min(1, u / 0.02) * Math.exp(-u / 0.25); }, 0.8, 0, 0.12, 0.3); pluck(t, 74, 0.6, 0, 0.8, 0.6, B.sfx); break; }
    case 'step': pop(t, [62, 66, 69][c.note], 0.9); put(B.sfx, t, u => Math.sin(2 * Math.PI * 80 * u) * Math.exp(-u / 0.06), 0.25, 0, 0.6); tick(t, 1800, 0.7); break;
    case 'lift': noiseSweep(t + 0.2, 0.42, 500, 2600, 0.45, -0.3, 0.3, 1.2); pop(t + 0.15, 69, 0.35); break;
    case 'scroll': for (let k = 0; k < 6; k++) tick(t + k * 0.045, 2000 + k * 90, 0.45); break;
    case 'coin': clink(t, c.kind); break;
    case 'scramble': {
      const n = Math.round(TL.b(c.len) / 0.035);
      for (let k = 0; k < n; k++) { const m = [81, 83, 86, 88, 90, 93][Math.floor((R() + 1) * 3) % 6]; put(B.sfx, t + k * 0.035, u => (Math.sin(2 * Math.PI * mtof(m) * u) + 0.3 * Math.sin(6 * Math.PI * mtof(m) * u)) * Math.exp(-u / 0.012), 0.05, R() * 0.5, 0.12); }
      const term = TL.COPY.terms[c.id === 'term0' ? 0 : 1].term;
      for (let j = 0; j < term.length; j++) { tick(t + TL.b(c.len) * (j + 1) / term.length, 2800 + j * 200, 1.0); pop(t + TL.b(c.len) * (j + 1) / term.length, 86 + j * 2, 0.25); }
      break;
    }
    case 'photo': photo(t); break;
    case 'wink': [86, 90, 93, 98].forEach((m, k) => pop(t + TL.b(k / 4), m, 0.45, (k - 1.5) * 0.3)); break;
  }
}
/* a whoosh into every cut, ending on it */
for (const tc of TL.CUTS) if (tc > 0.5) whoosh(tc, 0.45, tc === TL.b(8) ? 0.4 : 0.8);

/* ---- effects processing: echo for the hook, a reverb send ---- */
/* a ping-pong echo, a dotted eighth, for the hook */
const ECHO = (() => {
  const d = Math.round(0.75 * BEAT * SR), [sl, sr] = B.echo, ol = new Float32Array(N), or = new Float32Array(N);
  for (let i = d; i < N; i++) { ol[i] = sr[i - d] + 0.35 * or[i - d]; or[i] = sl[i - d] + 0.35 * ol[i - d]; }
  for (let i = 0; i < N; i++) { B.verb[0][i] += ol[i] * 0.3; B.verb[1][i] += or[i] * 0.3; }
  return [ol, or];
})();
function freeverb(inL, inR) {
  const sc = SR / 44100, combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], aps = [556, 441, 341, 225];
  const out = [new Float32Array(N), new Float32Array(N)];
  [[inL, 0], [inR, 23]].forEach(([inp, spread], ch) => {
    const cb = combs.map(c => ({ buf: new Float32Array(Math.round((c + spread) * sc)), i: 0, f: 0 }));
    const ab = aps.map(a => ({ buf: new Float32Array(Math.round((a + spread) * sc)), i: 0 }));
    const fb = 0.8, damp = 0.35, o = out[ch];
    for (let n = 0; n < N; n++) {
      const x = inp[n] * 0.015; let y = 0;
      for (const c of cb) { const v = c.buf[c.i]; c.f = v * (1 - damp) + c.f * damp; c.buf[c.i] = x + c.f * fb; c.i = (c.i + 1) % c.buf.length; y += v; }
      for (const a of ab) { const v = a.buf[a.i]; const z = -y + v; a.buf[a.i] = y + v * 0.5; a.i = (a.i + 1) % a.buf.length; y = z; }
      o[n] = y;
    }
  });
  return out;
}
const verb = freeverb(B.verb[0], B.verb[1]);

/* ---- the mix: bass and pad duck under the kick ---- */
const duck = new Float32Array(N).fill(1);
for (const tk of KICKS) { const s0 = Math.round(tk * SR); for (let i = 0; i < 0.3 * SR && s0 + i < N; i++) if (s0 + i >= 0) duck[s0 + i] = Math.min(duck[s0 + i], 1 - 0.45 * Math.exp(-i / SR / 0.09)); }
const G = { drums: 0.85, bass: 0.5, pad: 0.6, pluck: 0.6, lead: 0.55, sfx: 0.85, verb: 0.9, echo: 0.3 };
const mix = [new Float32Array(N), new Float32Array(N)];
const hpL = biquad('hp', 38, 0.7), hpR = biquad('hp', 38, 0.7);
for (let i = 0; i < N; i++) {
  for (let ch = 0; ch < 2; ch++) {
    mix[ch][i] = B.drums[ch][i] * G.drums + (B.bass[ch][i] * G.bass + B.pad[ch][i] * G.pad) * duck[i] + B.pluck[ch][i] * G.pluck
      + B.lead[ch][i] * G.lead + B.sfx[ch][i] * G.sfx + verb[ch][i] * G.verb + ECHO[ch][i] * G.echo;
  }
  mix[0][i] = hpL.run(mix[0][i]); mix[1][i] = hpR.run(mix[1][i]);
}
/* fade the very end so the last chord closes cleanly */
for (let i = 0; i < 0.35 * SR; i++) { const k = N - 1 - i, g2 = i / (0.35 * SR); mix[0][k] *= g2; mix[1][k] *= g2; }

/* ---- metering: BS.1770-4 loudness and 4x true peak ---- */
function kweight(x) {
  const y = new Float32Array(x.length);
  const s = [[1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585], [1.0, -2.0, 1.0, -1.99004745483398, 0.99007225036621]];
  let a1 = 0, a2 = 0, b1 = 0, b2 = 0, c1 = 0, c2 = 0, d1 = 0, d2 = 0;
  for (let n = 0; n < x.length; n++) {
    const [p, q] = s; const v = x[n];
    const u = p[0] * v + p[1] * a1 + p[2] * a2 - p[3] * b1 - p[4] * b2; a2 = a1; a1 = v; b2 = b1; b1 = u;
    const w = q[0] * u + q[1] * c1 + q[2] * c2 - q[3] * d1 - q[4] * d2; c2 = c1; c1 = u; d2 = d1; d1 = w;
    y[n] = w;
  }
  return y;
}
function lufs(l, r) {
  const kl = kweight(l), kr = kweight(r), blk = Math.round(0.4 * SR), hop = Math.round(0.1 * SR), z = [];
  for (let s = 0; s + blk <= l.length; s += hop) { let a = 0; for (let i = s; i < s + blk; i++) a += kl[i] * kl[i] + kr[i] * kr[i]; z.push(a / blk); }
  const L = v => -0.691 + 10 * Math.log10(v);
  const g1 = z.filter(v => L(v) > -70), m1 = g1.reduce((a, v) => a + v, 0) / g1.length;
  const g2 = g1.filter(v => L(v) > L(m1) - 10);
  return L(g2.reduce((a, v) => a + v, 0) / g2.length);
}
const FIR = (() => { const taps = 48, h = []; for (let p = 0; p < 4; p++) { const ph = []; for (let k = 0; k < taps; k++) { const x = (k - taps / 2) + p / 4; const s = x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x); const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * (k + p / 4) / taps); ph.push(s * w); } h.push(ph); } return h; })();
function truePeak(x) {
  let m = 0;
  for (let n = 24; n < x.length - 24; n++) {
    for (let p = 0; p < 4; p++) { let a = 0; const h = FIR[p]; for (let k = 0; k < 48; k++) a += x[n - 24 + k] * h[k]; const v = Math.abs(a); if (v > m) m = v; }
  }
  return 20 * Math.log10(m);
}
/* a look-ahead brickwall limiter on the sample peaks of both channels */
function limit(l, r, ceilDb) {
  const c = Math.pow(10, ceilDb / 20), la = Math.round(0.005 * SR), rel = Math.exp(-1 / (0.08 * SR));
  const need = new Float32Array(N); for (let i = 0; i < N; i++) need[i] = Math.min(1, c / Math.max(1e-9, Math.abs(l[i]), Math.abs(r[i])));
  /* minimum over the look-ahead window, then a smooth release */
  const minf = new Float32Array(N); const dq = [];
  for (let i = 0; i < N + la; i++) {
    if (i < N) { while (dq.length && need[dq[dq.length - 1]] >= need[i]) dq.pop(); dq.push(i); }
    const j = i - la; if (j < 0) continue; while (dq[0] < j) dq.shift(); minf[j] = need[dq[0]];
  }
  /* average over the look-ahead: the gain ramps down and reaches each peak's
     need exactly at the peak, rather than stepping */
  const ol = new Float32Array(N), or = new Float32Array(N); let gn = 1, acc = 0;
  for (let i = 0; i < N; i++) {
    acc += minf[i] - (i >= la ? minf[i - la] : 1);
    const target = Math.min(1, (acc + la) / la);
    gn = target < gn ? target : target + (gn - target) * rel; ol[i] = l[i] * gn; or[i] = r[i] * gn;
  }
  return [ol, or];
}
const rms = b2 => { let a = 0; for (let i = 0; i < N; i++) a += b2[0][i] ** 2 + b2[1][i] ** 2; return (10 * Math.log10(a / (2 * N) + 1e-12)).toFixed(1); };
console.log('bus RMS (dBFS, before gain): ' + Object.entries(B).map(([k, v]) => k + ' ' + rms(v)).join(', '));
const raw = lufs(mix[0], mix[1]);
let gainDb = -14 - raw, ceil = -2.0, out, I, TP;
for (let it = 0; it < 8; it++) {
  const g = Math.pow(10, gainDb / 20);
  const l = mix[0].map(v => v * g), r = mix[1].map(v => v * g);
  out = limit(l, r, ceil); I = lufs(out[0], out[1]);
  TP = Math.max(truePeak(out[0]), truePeak(out[1]));
  if (TP > -1.9) { ceil -= 0.3; continue; }   /* headroom for the AAC encode, which adds a few tenths */
  if (Math.abs(I + 14) < 0.03) break;
  gainDb += -14 - I;
}
console.log(`mix: raw ${raw.toFixed(2)} LUFS; mastered ${I.toFixed(2)} LUFS, ${TP.toFixed(2)} dBTP (limiter ceiling ${ceil.toFixed(1)} dBFS)`);

/* ---- 16-bit WAV, TPDF dither ---- */
function wav(file, l, r) {
  const n = l.length, buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  const d = rng(7);
  for (let i = 0; i < n; i++) for (let ch = 0; ch < 2; ch++) {
    const v = (ch ? r : l)[i] * 32767 + (d() + d()) * 0.5;
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v))), 44 + i * 4 + ch * 2);
  }
  writeFileSync(file, buf);
}
const mixFile = join(dir, 'mix.wav'), masterFile = join(dir, 'master.wav');
wav(mixFile, out[0], out[1]);

/* ---- ffmpeg loudnorm, two passes ---- */
const ln = 'loudnorm=I=-14:TP=-1:LRA=20';
const p1 = execFileSync('ffmpeg', ['-hide_banner', '-nostats', '-i', mixFile, '-af', ln + ':print_format=json', '-f', 'null', '-'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const grab = s => JSON.parse(s.slice(s.lastIndexOf('{'), s.lastIndexOf('}') + 1));
let m1;
try { m1 = grab(p1); } catch { const e = execFileSync('sh', ['-c', `ffmpeg -hide_banner -nostats -i '${mixFile}' -af '${ln}:print_format=json' -f null - 2>&1`], { encoding: 'utf8' }); m1 = grab(e); }
const second = `${ln}:measured_I=${m1.input_i}:measured_TP=${m1.input_tp}:measured_LRA=${m1.input_lra}:measured_thresh=${m1.input_thresh}:offset=${m1.target_offset}:linear=true:print_format=json`;
const e2 = execFileSync('sh', ['-c', `ffmpeg -hide_banner -nostats -y -i '${mixFile}' -af '${second},aresample=48000' -c:a pcm_s16le '${masterFile}' 2>&1`], { encoding: 'utf8' });
const m2 = grab(e2);
const report = { pass1: m1, pass2: m2, synth: { lufs: +I.toFixed(2), truePeak: +TP.toFixed(2) } };
writeFileSync(join(dir, 'loudness.json'), JSON.stringify(report, null, 2));
console.log(`loudnorm pass 1 (measured): ${m1.input_i} LUFS, ${m1.input_tp} dBTP, LRA ${m1.input_lra}`);
console.log(`loudnorm pass 2 (${m2.normalization_type}): ${m2.output_i} LUFS, ${m2.output_tp} dBTP`);
console.log(masterFile);
