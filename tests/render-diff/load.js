'use strict';
/* The render each page performs as it loads, old against new: the first paint
   of every slider, the first calc()/render(), the panel the page opens on, and
   whether a screen-reader timer is already pending. Nothing a reader does is
   involved, so this is the one comparison that covers the page as it is first
   seen. */
const { makePage, shippedHtml, diffRenders, diffWriteBag, orderDiffers } = require('./runpage');
const { PAGES, currentScript, baselineScript, BASELINE_REF } = require('./pages');

console.log(`load render, working tree against ${BASELINE_REF}\n`);

let bad = 0;
for (const name of Object.keys(PAGES)) {
  const cfg = PAGES[name];
  const html = shippedHtml(cfg.html);
  const A = makePage({ html, modules: cfg.modules, pageScript: baselineScript(name), scriptName: name });
  const B = makePage({ html, modules: cfg.modules, pageScript: currentScript(name), scriptName: name });

  const d = diffRenders(A.load, B.load);
  const bag = diffWriteBag(A.load, B.load);
  const reordered = orderDiffers(A.load, B.load);
  const timers = A.loadPending !== B.loadPending;
  const errs = [...A.errors, ...B.errors];
  const ok = !d.length && !bag && !timers && !errs.length;
  if (!ok) bad++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(20)} ${A.load.log.length} writes at load, ` +
              `${d.length} cells differ, ${bag ? 'write bag differs' : 'same writes'}, ` +
              `${reordered ? 'REORDERED' : 'same order'}, ${A.loadPending}/${B.loadPending} timers pending`);
  for (const x of d.slice(0, 5)) {
    console.log(`        ${x.el} ${x.prop}`);
    console.log(`          old ${JSON.stringify(String(x.old).slice(0, 100))}`);
    console.log(`          new ${JSON.stringify(String(x.now).slice(0, 100))}`);
  }
  for (const e of errs.slice(0, 4)) console.log(`        error: ${e}`);
}
console.log(bad ? `\nFAILURES: ${bad}` : '\nevery page loads to the same render, write for write');
process.exit(bad ? 1 : 0);
