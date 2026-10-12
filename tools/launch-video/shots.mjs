#!/usr/bin/env node
/* Photograph the real pension calculator for the launch video.

       node tools/launch-video/shots.mjs

   The page is served from this checkout exactly as it ships and opened in
   headless Chromium at 1200 CSS pixels and a device scale of 2. Nothing in
   it is mocked: the only CSS added settles the reveal animations and hides
   the floating "Ask Buddy" button and the consent banner, as
   tools/shoot-product.py does. The figures the film shows beside the shot
   are read from the page itself and the run fails if they are not the
   defaults the storyboard expects (a pot of EUR 460,066, about EUR 1,534 a
   month), so a change to the calculator cannot silently disagree with the
   film.

   Writes, to the work directory ($LV_WORK):
     calc-page.png   the page from the top down to the end of the growth chart
     calc-shots.json crop rectangles in CSS pixels, measured from the DOM's
                     bounding boxes (the panel of sliders, the results, the
                     growth chart, the nav, the headline), and the figures */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { serve, browser, WORK } from './lib.mjs';

const W = 1200, SCALE = 2;
const SETTLE = 'html{scroll-behavior:auto}'
  + '.reveal,.js-reveal .reveal{opacity:1!important;transform:none!important}'
  + '*{transition:none!important;animation:none!important;caret-color:transparent!important}'
  + 'html.pb-preveil *{visibility:visible!important}'
  + '.pb-b-btn,.pb-b-panel,.pb-consent,.pb-bookbar{display:none!important}';

const srv = await serve();
const b = await browser();
let failed = '';
try {
  const ctx = await b.newContext({ viewport: { width: W, height: 2200 }, deviceScaleFactor: SCALE, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { try { localStorage.setItem('pb-consent', 'rejected'); } catch (e) {} });
  const page = await ctx.newPage();
  await page.goto(srv.origin + '/pension-calculator.html', { waitUntil: 'load' });
  await page.addStyleTag({ content: SETTLE });
  await page.evaluate(() => document.documentElement.classList.remove('pb-preveil'));
  await page.evaluate(() => document.fonts.ready);
  /* wait for the results to settle on their final figures */
  await page.waitForFunction(() => {
    const p = document.querySelector('#potOut'), i = document.querySelector('#incOut');
    return p && i && /\d{3},\d{3}/.test(p.textContent) && window.__pbStable === undefined;
  }, null, { timeout: 15000 });
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const box = q => { const e = typeof q === 'string' ? document.querySelector(q) : q; if (!e) return null;
      const r = e.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }; };
    const chart = [...document.querySelectorAll('.chart-card')].find(c => c.querySelector('#chart'));
    const mine = document.querySelector('#mine').closest('.field');
    return {
      pot: document.querySelector('#potOut').textContent.trim(),
      income: document.querySelector('#incOut').textContent.trim(),
      inputs: { age: document.querySelector('#age').value, ret: document.querySelector('#ret').value,
        pot: document.querySelector('#pot').value, mine: document.querySelector('#mine').value,
        emp: document.querySelector('#emp').value, growth: document.querySelector('#growth').value },
      rects: { nav: box('nav'), h1: box('h1'), panel: box('.panel'), results: box('.res-hero'), chart: box(chart),
        sliders: (() => { const p = box('.panel'), m = box(mine); return { x: p.x, y: p.y, w: p.w, h: m.y + m.h - p.y + 28 }; })(),
        /* the results down to (not including) their divider and footnote */
        resultsTop: (() => { const r = box('.res-hero'), d = box('.res-hero .divline'); return { x: r.x, y: r.y, w: r.w, h: d.y - r.y + 4 }; })() },
      page: { w: document.documentElement.clientWidth, h: document.documentElement.scrollHeight },
    };
  });
  const expect = { pot: '€460,066', income: '€1,534' };
  if (info.pot !== expect.pot || info.income !== expect.income) {
    failed = `the calculator shows ${info.pot} and ${info.income} a month, not ${expect.pot} and ${expect.income}`;
  }
  if (!info.rects.chart) failed = 'no growth chart found';
  const clipH = Math.ceil(info.rects.chart.y + info.rects.chart.h + 48);
  await page.setViewportSize({ width: W, height: clipH });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(WORK, 'calc-page.png'), clip: { x: 0, y: 0, width: W, height: clipH } });
  info.scale = SCALE; info.clip = { w: W, h: clipH };
  writeFileSync(join(WORK, 'calc-shots.json'), JSON.stringify(info, null, 2));
  console.log(JSON.stringify({ pot: info.pot, income: info.income, inputs: info.inputs, clip: info.clip, rects: info.rects }));
} finally {
  await b.close(); srv.close();
}
if (failed) { console.error('shots: ' + failed); process.exit(1); }
