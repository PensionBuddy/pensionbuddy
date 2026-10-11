#!/usr/bin/env node
/* Render the launch video.

       node tools/launch-video/render.mjs              # both cuts
       node tools/launch-video/render.mjs --fmt=9x16   # one
       node tools/launch-video/render.mjs --frames=0-240 --fmt=16x9   # a test slice

   Needs $LV_WORK/calc-shots.json and calc-page.png (shots.mjs) and
   $LV_WORK/audio/master.wav (audio.mjs). Headless Chromium draws each of the
   60 frames a second in film.html: four subframes averaged in the page for
   motion blur, exported as a JPEG at quality 0.95 and piped straight into
   ffmpeg (libx264, CRF 19, preset slow, yuv420p, BT.709 tags, +faststart),
   muxed with the master as AAC at 192 kbit/s.

   Every frame's luminance (the whole frame and a 6x3 grid) is checked for
   flashing as tools/record-games.mjs does: a change of 0.1 in relative
   luminance from the last turning point counts as a transition, and more
   than six in any one second (three flashes, WCAG 2.3.1) fails the render.

   Writes docs/launch-video/pensionbuddy-launch-<fmt>.mp4 and
   pensionbuddy-launch-<fmt>-poster.png, and prints the file's duration,
   size and its loudness measured by ffmpeg's ebur128 (integrated, true peak). */
import { spawn, execFileSync } from 'node:child_process';
import { statSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { serve, browser, WORK, OUT } from './lib.mjs';
import { FPS, FRAMES, DURATION } from './timeline.mjs';

const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const fmts = arg('fmt', 'both') === 'both' ? ['16x9', '9x16'] : [arg('fmt')];
const [f0, f1] = (arg('frames', `0-${FRAMES}`)).split('-').map(Number);
const POSTER_T = 4.6;   // the lockup and the line, settled
const MAX_BYTES = 15 * 1024 * 1024;
const master = join(WORK, 'audio', 'master.wav');
for (const f of ['calc-shots.json', 'calc-page.png']) if (!existsSync(join(WORK, f))) { console.error(`missing ${f}: run shots.mjs first`); process.exit(1); }
if (!existsSync(master)) { console.error('missing audio/master.wav: run audio.mjs first'); process.exit(1); }

/* the WCAG 2.3.1 check, as in tools/record-games.mjs */
function turns(s) { let e = s[0], dir = 0; const at = []; for (let i = 1; i < s.length; i++) { const v = s[i];
  if (dir >= 0 && v <= e - 0.1) { at.push(i); dir = -1; e = v; } else if (dir <= 0 && v >= e + 0.1) { at.push(i); dir = 1; e = v; }
  else if ((dir > 0 && v > e) || (dir < 0 && v < e)) e = v; } return at; }
function most(at, per) { let best = 0; for (let i = 0; i < at.length; i++) { let j = i; while (j < at.length && at[j] - at[i] < per) j++; best = Math.max(best, j - i); } return best; }

const srv = await serve();
const br = await browser();
let failed = false;
try {
  for (const fmt of fmts) {
    const port = fmt === '9x16', W = port ? 1080 : 1920, H = port ? 1920 : 1080;
    const page = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    page.on('pageerror', e => { console.error('page error: ' + e.message); failed = true; });
    await page.goto(`${srv.origin}/tools/launch-video/film.html?fmt=${fmt}`);
    await page.evaluate(() => window.FILM.ready);
    const slice = f0 !== 0 || f1 !== FRAMES;
    const file = join(slice ? WORK : OUT, `pensionbuddy-launch-${fmt}${slice ? '-slice' : ''}.mp4`);
    const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
      '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      ...(slice ? [] : ['-i', master]),
      '-map', '0:v', ...(slice ? [] : ['-map', '1:a']),
      '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', arg('crf', '19'), '-profile:v', 'high', '-g', String(FPS * 2),
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
      ...(slice ? [] : ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000']),
      '-t', String((f1 - f0) / FPS), '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg exited ' + c)))));
    const lums = [], t0 = Date.now();
    for (let i = f0; i < f1; i++) {
      const r = await page.evaluate(i => window.FILM.frame(i), i);
      lums.push(r.lum);
      const buf = Buffer.from(r.url.slice(r.url.indexOf(',') + 1), 'base64');
      if (!ff.stdin.write(buf)) await new Promise(res => ff.stdin.once('drain', res));
      if ((i - f0) % 300 === 0) process.stdout.write(`${fmt} frame ${i}/${f1} (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
    }
    ff.stdin.end(); await done;
    /* flashes */
    const whole = most(turns(lums.map(l => l.whole)), FPS);
    let cell = 0; for (let c = 0; c < 18; c++) cell = Math.max(cell, most(turns(lums.map(l => l.cells[c])), FPS));
    const flashOk = whole <= 6 && cell <= 6;
    if (!flashOk) failed = true;
    /* the poster: a full-quality still of a settled frame */
    if (!slice) {
      const url = await page.evaluate(t => window.FILM.still(t, true), POSTER_T);
      writeFileSync(join(OUT, `pensionbuddy-launch-${fmt}-poster.png`), Buffer.from(url.split(',')[1], 'base64'));
    }
    await page.close();
    const bytes = statSync(file).size;
    const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_name,width,height,r_frame_rate,nb_frames', '-of', 'json', file], { encoding: 'utf8' }));
    let loud = '';
    if (!slice) {
      const e = execFileSync('sh', ['-c', `ffmpeg -hide_banner -nostats -i '${file}' -vn -af ebur128=peak=true -f null - 2>&1`], { encoding: 'utf8' });
      const I = e.match(/I:\s+(-?[\d.]+) LUFS/g).pop().match(/-?[\d.]+/)[0], TP = e.match(/Peak:\s+(-?[\d.]+) dBFS/g).pop().match(/-?[\d.]+/)[0];
      loud = `, ${I} LUFS integrated, ${TP} dBTP`;
      if (+TP > -1.0 || Math.abs(+I + 14) > 0.5) { failed = true; loud += ' (OUT OF SPEC)'; }
    }
    if (bytes > MAX_BYTES) failed = true;
    console.log(`${file}: ${(+probe.format.duration).toFixed(3)} s, ${(bytes / 1048576).toFixed(2)} MB, ${probe.streams.map(s => s.codec_name + (s.width ? ` ${s.width}x${s.height} ${s.r_frame_rate}` : '')).join(' + ')}${loud}; flashes: worst ${whole} whole-frame and ${cell} per-cell transitions in a second (limit 6)${flashOk ? '' : ' FAIL'}; ${((Date.now() - t0) / 1000).toFixed(0)} s to render`);
  }
} finally { await br.close(); srv.close(); }
process.exit(failed ? 1 : 0);
