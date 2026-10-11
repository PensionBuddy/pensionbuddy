#!/usr/bin/env node
/* Review the film before rendering it.

       node tools/launch-video/contact.mjs                 # contact sheets, both cuts
       node tools/launch-video/contact.mjs --fmt=9x16      # one cut
       node tools/launch-video/contact.mjs --guides        # draw the safe area
       node tools/launch-video/contact.mjs --stills=0,5.1,12.4   # full-size stills
       node tools/launch-video/contact.mjs --check         # reading time, frame by frame
       node tools/launch-video/contact.mjs --final         # the sheets for docs/launch-video/

   Sheets and stills go to $LV_WORK/review (or docs/launch-video/ with
   --final). --check steps through every frame at 60 fps and, for every line
   of text, finds the longest stretch it is fully readable (fully opaque,
   settled, not scrambled), then compares it with
   max(2.0 s, 1.0 s + 0.3 s a word). Exit 1 if a line falls short. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { serve, browser, WORK, OUT } from './lib.mjs';
import { needs, words, FPS, FRAMES, SHOTS, b } from './timeline.mjs';

const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k)); return a ? (a.includes('=') ? a.split('=')[1] : true) : d; };
const fmts = arg('fmt', 'both') === 'both' ? ['16x9', '9x16'] : [arg('fmt')];
const final = !!arg('final', false);
const dir = final ? OUT : join(WORK, 'review');
mkdirSync(dir, { recursive: true });

/* the moments a reviewer needs: each shot's first frame, every arrival
   settling, and each shot's last frame */
const MOMENTS = [
  ['intro, gap', [0, 0.25, 0.9, 1.95, 2.55, 2.95, 3.4, 4.1, 4.98, 5.0, 5.4, 6.2, 8.74, 8.95, 9.5, 10.2, 11.4, 12.48]],
  ['calculator, tax relief', [12.5, 12.75, 13.4, 14.2, 14.9, 15.6, 16.2, 16.6, 17.2, 18.1, 18.13, 18.6, 19.0, 19.5, 20.2, 20.8, 21.6, 22.48]],
  ['jargon, people, end card', [22.5, 22.7, 23.0, 23.5, 24.2, 25.0, 28.1, 28.13, 28.5, 29.1, 30.5, 31.24, 31.25, 31.6, 32.2, 33.0, 35.1, 35.98]],
];

const srv = await serve();
const br = await browser();
let failed = false;
try {
  for (const fmt of fmts) {
    const port = fmt === '9x16';
    const page = await br.newPage({ viewport: port ? { width: 540, height: 960 } : { width: 960, height: 540 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => { console.error('page error: ' + e.message); failed = true; });
    page.on('console', m => { if (m.type() === 'error') console.error('console: ' + m.text()); });
    await page.goto(`${srv.origin}/tools/launch-video/film.html?fmt=${fmt}${arg('guides') ? '&guides' : ''}`);
    await page.evaluate(() => window.FILM.ready);
    if (arg('check')) {
      const runs = await page.evaluate(({ frames, fps }) => {
        const best = new Map(), cur = new Map();
        for (let i = 0; i < frames; i++) {
          const seen = window.FILM.step(i / fps), now = new Set();
          for (const s of seen) {
            const key = s.id + '\u0000' + s.str;
            if (!best.has(key)) best.set(key, { id: s.id, str: s.str, small: s.small, transient: s.transient, best: 0, first: i / fps });
            if (s.ok) { now.add(key); cur.set(key, (cur.get(key) || 0) + 1); best.get(key).best = Math.max(best.get(key).best, cur.get(key)); }
          }
          for (const k of [...cur.keys()]) if (!now.has(k)) cur.delete(k);
        }
        return [...best.values()].map(v => ({ ...v, seconds: v.best / fps }));
      }, { frames: FRAMES, fps: FPS });
      console.log(`\n${fmt}: reading time, frame by frame (needs max(2.0, 1.0 + 0.3/word))`);
      for (const r of runs.sort((a, z) => a.first - z.first)) {
        const need = needs(r.str), ok = r.seconds + 1e-9 >= need;
        if (!ok && !r.transient) failed = true;
        console.log(`  ${ok ? 'ok  ' : r.transient ? 'pass' : 'FAIL'} ${r.seconds.toFixed(2).padStart(5)}s / ${need.toFixed(2)}s  ${String(words(r.str)).padStart(2)}w  ${r.id}${r.small ? ' (small)' : ''}${r.transient ? ' (passing value)' : ''}: ${r.str.slice(0, 70)}`);
      }
    }
    const stills = arg('stills');
    if (stills && stills !== true) {
      for (const t of stills.split(',').map(Number)) {
        const url = await page.evaluate(t => window.FILM.still(t, true), t);
        const f = join(dir, `still-${fmt}-${t.toFixed(2)}.png`);
        writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
        console.log(f);
      }
    }
    if (!arg('check') && !(stills && stills !== true)) {
      for (const [i, [title, times]] of MOMENTS.entries()) {
        const cols = port ? 6 : 4, tw = port ? 300 : 520;
        const url = await page.evaluate(({ times, cols, tw, title }) => window.FILM.sheet(times, cols, tw, title), { times, cols, tw, title: `Pensionbuddy launch film ${fmt}: ${title}` });
        const f = join(dir, `contact-${fmt}-${i + 1}.png`);
        writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
        console.log(f);
      }
    }
    await page.close();
  }
} finally { await br.close(); srv.close(); }
process.exit(failed ? 1 : 0);
