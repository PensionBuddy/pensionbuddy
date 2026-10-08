#!/usr/bin/env node
/* Record the short step clips (8 October 2026): stand-ins until Damian
   films his own.

       node tools/record-steps.mjs                 # every clip
       node tools/record-steps.mjs call-step-1     # one

   Two kinds. Screen clips drive the real pages in headless Chromium with a
   drawn cursor, one frame at a time, and photograph each frame. Photo clips
   are a slow pan and zoom over one of the site's own photographs. ffmpeg
   writes each clip at 1280 x 720, 30 fps, as an MP4 (H.264) and a WebM
   (VP8), into assets/video/, and its last frame (the finished state) as the poster, a .jpg and a
   .webp, into assets/img/.

   Needs: node's playwright, ffmpeg with libx264 and libvpx, and Chromium
   (CHROME, or Playwright's own). To swap in a real video later: save it as
   assets/video/<name>.mp4 and .webm and replace the poster; the markup does
   not change. */
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

/* playwright from the project, or from the global install */
const { chromium } = await import('playwright').catch(() =>
  createRequire(join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'x'))('playwright'));

const ROOT = resolve(join(dirname(fileURLToPath(import.meta.url)), '..'));
const FPS = 30, VW = 1280, VH = 720, PORT = 8765;
const only = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* the drawn cursor and its click ring */
const CURSOR = `(function(){var c=document.createElement('div');c.id='__cur';
  c.style.cssText='position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:28px;height:28px;transform:translate(-3px,-2px)';
  c.innerHTML='<svg viewBox="0 0 24 24" width="28" height="28"><path d="M4 2l15 11-6.5 1.2L16 21l-3 1.4-3.4-6.6L4 20z" fill="#0B1F1C" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  var r=document.createElement('div');r.id='__ring';
  r.style.cssText='position:fixed;z-index:2147483646;pointer-events:none;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:3px solid #0E8C7A;opacity:0';
  document.documentElement.append(r,c);
  window.__cur=function(x,y){c.style.left=x+'px';c.style.top=y+'px';};
  window.__ring=function(x,y,t){r.style.left=x+'px';r.style.top=y+'px';r.style.opacity=String(1-t);r.style.transform='scale('+(1+t*3.5)+')';};})();`;
/* nothing but the page: no consent bar, Ask Buddy, booking bar or deadline nag */
const QUIET = `body [class*="consent"],body [id*="onsent"],body [class*="pb-ask"],body [id*="pbAsk"],body [class*="bookbar"],body .pb-buddy-fab,#pbBuddyBtn,#pbBuddyPanel{display:none!important}
  html{scroll-behavior:auto!important}`;

function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

class Reel {
  /* zoom: how far the camera is in (1 = the whole 1440 x 810 window); it
     follows the cursor, eased, and stays inside the window */
  constructor(page, dir, zoom = 1) {
    this.page = page; this.dir = dir; this.n = 0; this.x = 640; this.y = 420;
    this.cw = 1440 / zoom; this.ch = 810 / zoom; this.cx = null; this.cy = null;
  }
  async shot() {
    const k = this.cx === null ? 1 : .12;
    this.cx = this.cx === null ? this.x : this.cx + (this.x - this.cx) * k;
    this.cy = this.cy === null ? this.y : this.cy + (this.y - this.cy) * k;
    const x = Math.min(Math.max(this.cx - this.cw / 2, 0), 1440 - this.cw), y = Math.min(Math.max(this.cy - this.ch / 2, 0), 810 - this.ch);
    const buf = await this.page.screenshot({ type: 'png', clip: { x, y, width: this.cw, height: this.ch } });
    writeFileSync(join(this.dir, String(this.n++).padStart(5, '0') + '.png'), buf);
    await sleep(1000 / FPS);
  }
  async place(x, y) { this.x = x; this.y = y; await this.page.mouse.move(x, y); await this.page.evaluate(([a, b]) => window.__cur(a, b), [x, y]); }
  async hold(frames) { for (let i = 0; i < frames; i++) { await this.shot(); } }
  async moveTo(x, y, frames) {
    const x0 = this.x, y0 = this.y;
    for (let i = 1; i <= frames; i++) {
      const e = ease(i / frames);
      await this.place(x0 + (x - x0) * e, y0 + (y - y0) * e - Math.sin(Math.PI * i / frames) * 30);
      await this.shot();
    }
  }
  async ring(frames = 10) {
    for (let i = 0; i <= frames; i++) {
      await this.page.evaluate(([a, b, t]) => window.__ring(a, b, t), [this.x, this.y, i / frames]);
      await this.shot();
    }
  }
  async to(sel, frames, dx = 0, dy = 0) {
    const b = await this.page.locator(sel).first().boundingBox();
    await this.moveTo(b.x + b.width / 2 + dx, b.y + b.height / 2 + dy, frames);
  }
  async click(sel, frames) {
    await this.to(sel, frames);
    await this.hold(6);
    await this.page.mouse.down(); await this.ring(4); await this.page.mouse.up();
    await this.ring(6);
    await this.page.evaluate(([a, b]) => window.__ring(a, b, 1), [this.x, this.y]);
  }
  async type(text, per = 3) {
    for (const ch of text) { await this.page.keyboard.type(ch); await this.hold(per); }
  }
  async drag(sel, from, to, frames) {
    const b = await this.page.locator(sel).first().boundingBox();
    const at = v => b.x + 10 + (b.width - 20) * v;
    await this.moveTo(at(from), b.y + b.height / 2, 24);
    await this.page.mouse.down(); await this.hold(4);
    for (let i = 1; i <= frames; i++) { await this.place(at(from + (to - from) * ease(i / frames)), b.y + b.height / 2); await this.shot(); }
    await this.page.mouse.up();
  }
}

/* scroll so the element's top sits this far below the window's top */
async function top(page, sel, gap) {
  await page.evaluate(([s, g]) => { scrollTo(0, document.querySelector(s).getBoundingClientRect().top + scrollY - g); }, [sel, gap]);
  await sleep(400);
}

async function open(page, path) {
  await page.goto(`http://127.0.0.1:${PORT}/${path}`, { waitUntil: 'load' });
  await page.addStyleTag({ content: QUIET });
  await page.evaluate(CURSOR);
  await sleep(600);
}

/* the clips. Screen clips get a 1440 x 810 window (the nav's full row needs
   1301px), scaled down to 1280 x 720. */
const CLIPS = {
  /* You reach out: the nav's booking button, pressed */
  'call-step-1': { screen: async (r, page) => {
    await open(page, 'index.html');
    /* the click is shown; the clip moves to the booking page itself */
    await page.evaluate(() => document.addEventListener('click', e => e.preventDefault(), true));
    await r.place(760, 560); await r.hold(12);
    await r.click('#navLinks a.btn[href="booking.html"]', 38);
    await r.hold(14);
    await open(page, 'thank-you.html');
    r.cx = null; await r.place(260, 300);
    await r.to('h1', 34, 60, 30); await r.hold(50);
  } },
  /* We talk it through: Damian at his desk with his notes */
  'call-step-2': { photo: 'damian-at-desk-notes.jpg', seconds: 7, zoom: [1.0, 1.18], focus: [0.42, 0.45] },
  /* You decide: a guess, the real figure, then a change to try */
  'call-step-3': { zoom: 1.35, screen: async (r, page) => {
    await open(page, 'pension-calculator.html');
    await top(page, '#pbGuessRange', 260);
    await r.place(560, 300); await r.hold(10);
    await r.drag('#pbGuessRange', .3, .55, 36); await r.hold(8);
    await r.click('#pbGuessGo', 24); await r.hold(30);
    await r.drag('#mine', 300 / 5000, 800 / 5000, 50); await r.hold(40);
  } },
  /* Tell us where you worked: the finder's first step, filled in */
  'track-step-1': { screen: async (r, page) => {
    await open(page, 'find-my-pension.html');
    await top(page, '#pfEmp0Name', 220);
    await r.place(760, 300); await r.hold(8);
    await r.click('#pfEmp0Name', 26); await r.type("Murphy's Hardware", 2);
    await r.click('#pfEmp0From', 18); await r.type('1998', 4);
    await r.click('#pfEmp0To', 14); await r.type('2004', 4);
    await r.hold(40);
  } },
  /* We trace and value them: the pensions, totted up */
  'track-step-2': { zoom: 1.2, screen: async (r, page) => {
    await open(page, 'my-pensions.html');
    await top(page, '#ptName0', 90);
    await r.place(820, 260); await r.hold(8);
    await r.click('#ptName0', 24); await r.type('First job', 2);
    await r.click('#ptValue0', 14); await r.type('38,000', 3);
    await r.click('#ptAmc0', 14); await r.type('1', 3);
    await r.hold(12);
    await r.click('#ptAdd', 20); await r.hold(6);
    await r.click('#ptName1', 18); await r.type('Second job', 2);
    await r.click('#ptValue1', 14); await r.type('21,500', 3);
    await r.hold(50);
  } },
  /* We explain your options: Damian talking it through on screen */
  'track-step-3': { photo: 'damian-at-desk-screen.jpg', seconds: 7, zoom: [1.16, 1.0], focus: [0.55, 0.42] },
};

function ffmpeg(args) { execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' }); }

function encode(name, input) {
  const v = join(ROOT, 'assets', 'video', name), img = join(ROOT, 'assets', 'img', name);
  const vf = `scale=${VW}:${VH}:flags=lanczos,format=yuv420p`;
  ffmpeg([...input, '-vf', vf, '-c:v', 'libx264', '-profile:v', 'baseline', '-crf', '27', '-preset', 'slow', '-movflags', '+faststart', '-an', v + '.mp4']);
  ffmpeg([...input, '-vf', vf, '-c:v', 'libvpx', '-b:v', '900k', '-crf', '12', '-an', v + '.webm']);
  ffmpeg(['-sseof', '-0.2', '-i', v + '.mp4', '-frames:v', '1', '-q:v', '6', img + '.jpg']);
  ffmpeg(['-sseof', '-0.2', '-i', v + '.mp4', '-frames:v', '1', '-c:v', 'libwebp', '-quality', '70', img + '.webp']);
  for (const f of [v + '.mp4', v + '.webm', img + '.jpg', img + '.webp']) {
    console.log('  ' + f.slice(ROOT.length + 1) + '  ' + Math.round(statSync(f).size / 1024) + ' KB');
  }
}

function photo(name, c) {
  /* zoompan over a 4x upscale, so the slow move does not judder */
  const n = c.seconds * FPS, [z0, z1] = c.zoom, [fx, fy] = c.focus;
  const z = `${z0}+(${z1 - z0})*(0.5-0.5*cos(PI*on/${n}))`;
  const vf = `scale=5120:-2,crop=5120:2880,zoompan=z='${z}':x='(iw-iw/zoom)*${fx}':y='(ih-ih/zoom)*${fy}':d=${n}:s=${VW}x${VH}:fps=${FPS}`;
  const dir = mkdtempSync(join(tmpdir(), 'pb-steps-'));
  ffmpeg(['-i', join(ROOT, 'assets', 'img', c.photo), '-vf', vf, '-frames:v', String(n), join(dir, '%05d.png')]);
  encode(name, ['-framerate', String(FPS), '-i', join(dir, '%05d.png')]);
  rmSync(dir, { recursive: true });
}

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
await sleep(800);
let browser;
try {
  const exe = process.env.CHROME;
  browser = await chromium.launch(exe ? { executablePath: exe } : {});
  for (const [name, c] of Object.entries(CLIPS)) {
    if (only.length && !only.includes(name)) { continue; }
    console.log(name);
    if (c.photo) { photo(name, c); continue; }
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2, reducedMotion: 'no-preference' });
    await ctx.addInitScript(() => { try { localStorage.setItem('pb-consent', 'rejected'); } catch (e) {} });
    const page = await ctx.newPage();
    const dir = mkdtempSync(join(tmpdir(), 'pb-steps-'));
    await c.screen(new Reel(page, dir, c.zoom || 1.9), page);
    await ctx.close();
    encode(name, ['-framerate', String(FPS), '-i', join(dir, '%05d.png')]);
    rmSync(dir, { recursive: true });
  }
} finally {
  if (browser) { await browser.close(); }
  server.kill();
}
